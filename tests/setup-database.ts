import { DbHelper } from "./db-helper";

const dbHelper = await DbHelper.create();
console.log("Look here", dbHelper.getContainer().getConnectionUri());
process.env.DATABASE_URL = dbHelper.getContainer().getConnectionUri();