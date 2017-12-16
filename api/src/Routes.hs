{-# LANGUAGE BangPatterns        #-}
{-# LANGUAGE OverloadedStrings   #-}
{-# LANGUAGE RecordWildCards     #-}
{-# LANGUAGE TemplateHaskell     #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeOperators       #-}
{-# LANGUAGE DataKinds           #-}

module Routes
    ( PassportConfig(..)
    , LocalAPI
    , serveLocalAPI
    ) where

import Control.Monad.Except
import Control.Concurrent

import Data.Maybe
import Data.Time
import Data.Monoid

import Data.Aeson (Value)

import           Data.Text          (Text)
import qualified Data.Text          as T
import qualified Data.Text.Encoding as T

import qualified Data.Vector as V

import qualified Database.RethinkDB as R

import Avers as Avers
import Avers.TH
import Avers.API
import Avers.Server

import Servant.API hiding (Patch)
import Servant.Server

import Web.Cookie

import Queries
import Revision
import Types
import Wordlist
import PassportAuth
import PassportConfirmationEmail

import Storage.ObjectTypes
import Storage.Objects.Account
import Storage.Objects.Boulder
import Storage.Objects.Passport

import Prelude


data SignupRequest2 = SignupRequest2
    { reqLogin     :: Text
    }

data SignupResponse2 = SignupResponse2
    { _resObjId :: ObjId
    }



-------------------------------------------------------------------------------
type CreatePassport
    = "login"
        :> ReqBody '[JSON] CreatePassportBody
        :> Post '[JSON] CreatePassportResponse

data CreatePassportBody = CreatePassportBody
    { reqEmail :: Text
    }

data CreatePassportResponse = CreatePassportResponse
    { _resPassportId :: Text
    , _resSecurityCode :: Text
    }


-------------------------------------------------------------------------------
type ConfirmPassport
    = "login" :> "confirm"
        :> QueryParam "passportId" Text
        :> QueryParam "confirmationToken" Text
        :> Get '[JSON] (Headers '[Header "Location" Text] NoContent)


-------------------------------------------------------------------------------
type AwaitPassportConfirmation
    = "login" :> "verify"
        :> QueryParam "passportId" Text
        :> Get '[JSON] (Headers '[Header "Set-Cookie" SetCookie] NoContent)


-------------------------------------------------------------------------------
type PassportAPI
    =    CreatePassport
    :<|> ConfirmPassport
    :<|> AwaitPassportConfirmation



type LocalAPI
    -- server the git revsion sha
    = "revision"
      :> Get '[PlainText] Text

    -- serve a list of all active bouldersIds in the gym
    :<|> "collection" :> "activeBoulders"
      :> Get '[JSON] [ObjId]

    -- serve a list of boulderIds that are owned/authored by the user
    :<|> "collection" :> "ownBoulders"
      :> Credentials
      :> Get '[JSON] [ObjId]

    -- serve a list of all accountIds
    :<|> "collection" :> "accounts"
      :> Get '[JSON] [ObjId]

    -- serve a list of all non-user accountIds
    :<|> "collection" :> "adminAccounts"
      :> Credentials
      :> Get '[JSON] [ObjId]

    :<|> "signup"
      :> ReqBody '[JSON] SignupRequest2
      :> Post '[JSON] SignupResponse2

    :<|> PassportAPI


serveLocalAPI :: PassportConfig -> Avers.Handle -> Server LocalAPI
serveLocalAPI pc aversH =
         serveRevision
    :<|> serveActiveBouldersCollection
    :<|> serveOwnBouldersCollection
    :<|> serveAccounts
    :<|> serveAdminAccounts
    :<|> serveSignup
    :<|> servePassportAPI

  where
    servePassportAPI =
             serveCreatePassport
        :<|> serveConfirmPassport
        :<|> serveAwaitPassportConfirmation

    ----------------------------------------------------------------------------
    sessionCookieName     = "session"
    sessionExpirationTime = 2 * 365 * 24 * 60 * 60

    mkSetCookie :: SessionId -> Handler SetCookie
    mkSetCookie sId = do
        now <- liftIO $ getCurrentTime
        pure $ def
            { setCookieName = sessionCookieName
            , setCookieValue = T.encodeUtf8 (unSessionId sId)
            , setCookiePath = Just "/"
            , setCookieExpires = Just $ addUTCTime sessionExpirationTime now
            , setCookieHttpOnly = True
            }


    serveRevision =
        pure $ T.pack $ fromMaybe "HEAD" $(revision)

    serveActiveBouldersCollection = do
        boulders <- reqAvers2 aversH $ do
            runQueryCollect $
                R.Map mapId $
                R.OrderBy [R.Descending "setDate"] $
                viewTable activeBouldersView

        pure $ map ObjId $ V.toList boulders

    serveOwnBouldersCollection cred = do
        ownerId <- credentialsObjId aversH cred
        objIds <- reqAvers2 aversH $ do
            -- FIXME: we should check if the setter is in the list of setters
            let isOwnBoulderA :: R.Exp R.Object -> R.Exp Bool
                isOwnBoulderA = \x -> R.Eq
                    (R.GetField "setter" x :: R.Exp Text)
                    (R.lift $ unObjId ownerId)

            runQueryCollect $
                R.Map mapId $
                R.OrderBy [R.Descending "setDate"] $
                R.Filter isOwnBoulderA $
                viewTable bouldersView

        pure $ map ObjId $ V.toList objIds

    serveAccounts = do
        objIds <- reqAvers2 aversH $ do
            runQueryCollect $
                R.Map mapId $
                R.OrderBy [R.Descending "name"] $
                viewTable accountsView

        pure $ map ObjId $ V.toList objIds

    serveAdminAccounts cred = do
        ownerId <- credentialsObjId aversH cred
        objIds <- reqAvers2 aversH $ do
            runQueryCollect $
                R.Map mapId $
                R.OrderBy [R.Descending "name"] $
                R.Filter isSetter $
                viewTable accountsView

        pure $ map ObjId $ V.toList objIds


    createAccount :: Text -> Maybe Text -> Handler ObjId
    createAccount login mbEmail = do
        reqAvers2 aversH $ do
            accId <- Avers.createObject accountObjectType rootObjId $ Account
                { accountLogin = login
                , accountRole = User
                , accountEmail = mbEmail
                , accountName = Just ""
                }

            -- TODO: Is this necessary if we have login only via email? It's rather
            -- dangerous to have accounts protected with an empty secret because then
            -- anyone can authenticate against that account.
            updateSecret (SecretId (unObjId accId)) ""

            pure accId

    serveSignup body = do
        accId <- createAccount (reqLogin body) Nothing
        pure $ SignupResponse2 accId


    serveCreatePassport CreatePassportBody{..} = do
        -- 1. Lookup account by email. If no such account exists, create a new one.
        accId <- do
            accountIds <- reqAvers2 aversH $ runQueryCollect $
                R.Limit 1 $
                R.Map mapId $
                R.Filter (matchEmail (R.lift reqEmail)) $
                viewTable accountsView

            case V.toList accountIds of
                [accId] -> pure $ ObjId accId
                _ -> do
                    liftIO $ putStrLn $ T.unpack $ "Account with email " <>
                        reqEmail <> " not found, creating new account."
                    createAccount reqEmail (Just reqEmail)

        -- 2. Create a new Passport object.
        securityCode <- liftIO mkSecurityCode
        confirmationToken <- liftIO (newId 16)

        passportId <- reqAvers2 aversH $ do
            Avers.createObject passportObjectType rootObjId $ Passport
                { passportAccountId = accId
                , passportSecurityCode = securityCode
                , passportConfirmationToken = confirmationToken
                , passportValidity = PVUnconfirmed
                }

        -- 3. Send email
        -- TODO: actually send the email.
        -- TODO: link requires the full domain name where the API is hosted,
        -- it therefore must be configurable.
        liftIO $ do
            putStrLn "\n\n-------------------------"
            putStrLn $ show $ passportConfirmationEmail
                pc reqEmail (unObjId passportId) securityCode confirmationToken
            putStrLn "\n\n-------------------------"

        -- 4. Send response
        pure $ CreatePassportResponse
            { _resPassportId = unObjId passportId
            , _resSecurityCode = securityCode
            }

    serveConfirmPassport mbPassportId mbConfirmationToken = do
        -- Query params in Servant are always optional (Maybe), but we require them here.
        passportId <- case mbPassportId of
            Nothing -> throwError err400 { errBody = "passportId missing" }
            Just pId -> pure $ ObjId pId

        confirmationToken <- case mbConfirmationToken of
            Nothing -> throwError err400 { errBody = "confirmationToken missing" }
            Just x -> pure x

        -- Lookup the latest snapshot of the Passport object.
        (Snapshot{..}, Passport{..}) <- reqAvers2 aversH $ do
            snapshot <- lookupLatestSnapshot (BaseObjectId passportId)
            passport <- case parseValueAs passportObjectType (snapshotContent snapshot) of
                Left e  -> throwError e
                Right x -> pure x

            pure (snapshot, passport)

        -- Check the confirmationToken. Fail if it doesn't match.
        when (confirmationToken /= passportConfirmationToken) $ do
            throwError err400 { errBody = "wrong confirmation token" }

        -- Patch the "validity" field to mark the Passport as valid.
        reqAvers2 aversH $ applyObjectUpdates
            (BaseObjectId passportId)
            snapshotRevisionId
            rootObjId
            [Set { opPath = "validity", opValue = Just (toJSON PVValid) }]
            False

        -- Apparently this is how you do a 30x redirect in Servant…
        -- TODO: Domain must be configurable.
        throwError $ err301
            { errHeaders = [("Location", T.encodeUtf8 (pcAppDomain pc) <> "/email-confirmed")]
            }

    -- This request blocks until the Passport either becomes valid or expires.
    serveAwaitPassportConfirmation mbPassportId = do
        passportId <- case mbPassportId of
            Nothing -> throwError err400
            Just pId -> pure $ ObjId pId

        let go = do
                -- Lookup the latest snapshot of the Passport object.
                (Snapshot{..}, Passport{..}) <- reqAvers2 aversH $ do
                    snapshot <- lookupLatestSnapshot (BaseObjectId passportId)
                    passport <- case parseValueAs passportObjectType (snapshotContent snapshot) of
                        Left e  -> throwError e
                        Right x -> pure x

                    pure (snapshot, passport)

                case passportValidity of
                    PVValid ->
                        -- Exit the loop.
                        pure (passportAccountId, snapshotRevisionId)

                    PVUnconfirmed ->
                        -- Sleep a bit and then retry.
                        liftIO (threadDelay 500000) >> go

                    PVExpired ->
                        -- Fail the request.
                        throwError err400

        (accId, revId) <- go

        -- Mark the passport as expired, so that it can not be reused.
        reqAvers2 aversH $ applyObjectUpdates
            (BaseObjectId passportId)
            revId
            rootObjId
            [Set { opPath = "validity", opValue = Just (toJSON PVExpired) }]
            False

        -- The Passport object is valid. Create a new session for the
        -- account in the Passport object.
        now <- liftIO getCurrentTime
        sessId <- SessionId <$> liftIO (newId 80)

        reqAvers2 aversH $ saveSession $ Session sessId accId now now

        setCookie <- mkSetCookie sessId

        -- 4. Respond with the session cookie and status=200
        pure $ addHeader setCookie NoContent


$(deriveJSON (deriveJSONOptions "req")  ''SignupRequest2)
$(deriveJSON (deriveJSONOptions "_res") ''SignupResponse2)

$(deriveJSON (deriveJSONOptions "req")  ''CreatePassportBody)
$(deriveJSON (deriveJSONOptions "_res") ''CreatePassportResponse)
