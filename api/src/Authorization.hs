{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards   #-}

module Authorization (aosAuthorization) where

import           Avers                  as Avers
import           Avers.API
import           Avers.Server

import qualified Data.Vector            as V
import qualified Database.RethinkDB     as R

import           Control.Monad.Except

import           Prelude

import           Queries
import           Storage.Objects.Account
import           Storage.Objects.Boulder


aosAuthorization :: Avers.Server.Authorizations
aosAuthorization = Avers.Server.Authorizations
    { createObjectAuthz = \cred objType ->
        [ sufficient $ return (objType == "account")
        , sufficient $ do
            session <- case cred of
                CredAnonymous -> throwError NotAuthorized
                CredSessionId sId -> lookupSession sId
            isSet <- sessionIsSetter session
            isAdm <- sessionIsAdmin session
            return $ isSet || isAdm
        , pure RejectR
        ]
    , lookupObjectAuthz = \cred objId ->
        [ sufficient $ do
            objectIsBoulder objId
        , sufficient $ do
            session <- case cred of
                CredAnonymous -> throwError NotAuthorized
                CredSessionId sId -> lookupSession sId
            hasCreated <- sessionCreatedObject session objId
            isAdm <- sessionIsAdmin session
            return $ hasCreated || isAdm
        ]
    , patchObjectAuthz = \cred objId ops ->
        [ sufficient $ do
            session <- case cred of
                CredAnonymous -> throwError NotAuthorized
                CredSessionId sId -> lookupSession sId
            sessionIsAdmin session
        , do
            obj <- lookupObject objId
            case objectType obj of
                "account" -> do
                    -- The patch set is being applied to an "account" object.
                    -- When any of the operations touches the "role" field, only allow
                    -- if the user is an admin.
                    let isRestrictedOperation = \op -> case op of Set{..} -> opPath == "role"; _ -> False
                    if not (any isRestrictedOperation ops)
                        then pure ContinueR
                        else pure RejectR

                "boulder" -> do
                    -- Allow only when the user is in the setters list of the boulder.
                    session <- case cred of
                        CredAnonymous -> throwError NotAuthorized
                        CredSessionId sId -> lookupSession sId
                    let sessionId = sessionObjId session

                    -- User who created the boulder can always edit it, even if he or she
                    -- is no longer one of the setters.
                    hasCreated <- sessionCreatedObject session objId

                    -- If the user is setter then allow.
                    boulder <- objectContent (BaseObjectId objId)
                    let isSet = sessionId `elem` boulderSetter boulder

                    -- If the boulder is draft and no setter assigned allow changes
                    setter <- sessionIsSetter session
                    admin <- sessionIsAdmin session
                    let isUnassignedDraft = (boulderIsDraft boulder == 1) && (boulderSetter boulder == []) && (setter || admin)

                    if hasCreated || isSet || isUnassignedDraft
                        then pure ContinueR
                        else pure RejectR

                _ -> pure ContinueR

        , sufficient $ do
            session <- case cred of
                CredAnonymous -> throwError NotAuthorized
                CredSessionId sId -> lookupSession sId
            isObj <- sessionIsObject session objId
            hasCreated <- sessionCreatedObject session objId
            isAdm <- sessionIsAdmin session
            return $ isObj || hasCreated || isAdm
        ]
    , deleteObjectAuthz = \_ _ -> [pure RejectR]
    , uploadBlobAuthz = \_ _ -> [pure AllowR]
    , lookupBlobAuthz = \_ _ -> [pure AllowR]
    , lookupBlobContentAuthz = \_ _ -> [pure AllowR]
    }

-- | True if the object is a boulder
objectIsBoulder :: ObjId -> Avers Bool
objectIsBoulder objId = do
    obj <- lookupObject objId
    return ((objectType obj) == "boulder")

-- | True if the session is an admin.
sessionIsAdmin :: Session -> Avers Bool
sessionIsAdmin session = do
    let sessionId = sessionObjId session
    admins <- runQueryCollect $
            R.Map mapId $
            R.Filter (hasAccess "admin") $
            viewTable accountsView

    elem sessionId <$> (pure $ map ObjId $ V.toList admins)

-- | True if the session is a setter.
sessionIsSetter :: Session -> Avers Bool
sessionIsSetter session = do
    let sessionId = sessionObjId session
    setters <- runQueryCollect $
            R.Map mapId $
            R.Filter (hasAccess "setter") $
            viewTable accountsView

    elem sessionId <$> (pure $ map ObjId $ V.toList setters)

{-
-- | True if the session is in setter list of boulder.
sessionIsBoulderSetter :: Session -> ObjId -> Avers Bool
sessionIsBoulderSetter session _objId = do
    let sessionId = sessionObjId session
    setters <- runQueryCollect $
            R.Map mapId $
            R.Filter (hasAccess "setter") $
            viewTable accountsView

    elem sessionId <$> (pure $ map ObjId $ V.toList setters)
-}
