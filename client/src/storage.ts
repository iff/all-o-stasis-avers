/*
module Storage
( Account
, BoulderStats
, Boulder
) where
*/


import * as Avers from 'avers';


export class Account
    { login : string;
      role  : string;
    }
Avers.definePrimitive(Account, 'login', '');
Avers.definePrimitive(Account, 'role',  'user');


export class BoulderStats
    { likes      : number;
      dislikes   : number;
      gradeVotes : number[];
    }

Avers.definePrimitive(BoulderStats, 'likes',       0);
Avers.definePrimitive(BoulderStats, 'dislikes',    0);
Avers.definePrimitive(BoulderStats, 'gradeVotes',  []);


export class Boulder
    { setter     : string[];
      grade      : string;
      gradeNr    : number;
      sector     : string;
      date       : Date;
      removed    : Date;
      name       : string;
      comments   : string;
      stats      : BoulderStats;
    }

Avers.definePrimitive(Boulder, 'setter');
Avers.definePrimitive(Boulder, 'grade',    'yellow');
Avers.definePrimitive(Boulder, 'gradeNr',  0);
Avers.definePrimitive(Boulder, 'sector',   '');
Avers.definePrimitive(Boulder, 'date');
Avers.definePrimitive(Boulder, 'removed');
Avers.definePrimitive(Boulder, 'name',     '');
Avers.definePrimitive(Boulder, 'comments', '');
Avers.defineObject(Boulder,    'stats',    BoulderStats, {});
