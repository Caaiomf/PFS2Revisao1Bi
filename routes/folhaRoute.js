import express from "express";
import FolhaController from "../controllers/folhaController.js";
import AuthMiddleware from "../middlewares/authMiddleware.js"



const router = express.Router();
const ctrl = new FolhaController();
const auth = new AuthMiddleware();

router.post("/", auth.validar, (req,res) =>{
    //#swagger.tags = ['Folha de pagamento']
    //#swagger.summary = 'Gerar folha de pagamento do mes'
    ctrl.gerarFolha(req,res);
})

export default router;