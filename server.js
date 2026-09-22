import express from 'express'
import funcionarioRouter from './routes/funcionarioRoute.js'
import rhRouter from './routes/rhRoute.js'
import aumentoRouter from './routes/aumentoRoute.js'
import folhaRouter from './routes/folhaRoute.js'
import swaggerUi from 'swagger-ui-express'
import cookieParser from 'cookie-parser'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const outputJson = require("./swagger-output.json");

const app = express();

app.use(express.json())
app.use(cookieParser());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(outputJson))
app.use("/funcionario", funcionarioRouter);
app.use("/rh", rhRouter);
app.use("/aumento", aumentoRouter);
app.use("/folha", folhaRouter);

app.listen(5000, function() {
    console.log("servidor web em funcionamento!");
});