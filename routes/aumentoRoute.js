import express from "express";
import AumentoController from "../controllers/aumentoController.js";
import AuthMiddleware from "../middlewares/authMiddleware.js";



const router = express.Router();
const ctrl = new AumentoController();
const auth = new AuthMiddleware();

router.post("/", auth.validar, (req,res) =>{
    // #swagger.tags = ['Aumento Salarial']
    // #swagger.summary = 'Aplicar aumento Salarial aos funcionarios ativos'
    ctrl.aplicarAumento(req,res);
});

export default router;