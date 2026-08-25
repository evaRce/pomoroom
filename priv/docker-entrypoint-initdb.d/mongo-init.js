db = db.getSiblingDB('pomoroom_dev');
db.createUser({
  "user":"mongo",
  "pwd":"abc123.",
  "roles":["dbOwner"]
});

db = db.getSiblingDB('pomoroom_test');
db.createUser({
  "user":"mongo",
  "pwd":"abc123.",
  "roles":["dbOwner"]
});