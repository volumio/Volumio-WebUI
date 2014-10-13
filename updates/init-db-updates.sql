PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE updates (
    modulename VARCHAR(50) PRIMARY KEY,
    version INTEGER
);

COMMIT;
