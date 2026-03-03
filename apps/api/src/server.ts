import app from "./app.js";
import { env } from "./config.js";
import "./jobs/queues.js";
import "./jobs/priceWorker.js";

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});
