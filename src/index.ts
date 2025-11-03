import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`Servidor escuchando en el puerto ${config.port}`);
});
