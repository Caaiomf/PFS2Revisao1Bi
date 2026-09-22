import express from "express";
import FuncionarioController from "../controllers/funcionarioController.js";
import AuthMiddleware from "../middlewares/authMiddleware.js";



const router = express.Router();

let ctrl = new FuncionarioController();
let auth = new AuthMiddleware();

router.post("/", auth.validar, (req,res) => {
    // #swagger.tags = ['Funcionario']
    // #swagger.summary = 'Cadastrar um funcionario existente'
    ctrl.cadastrar(req,res);
});
router.delete("/:id", auth.validar, (req,res) => {
    // #swagger.tags = ['Funcionario']
    // #swagger.summary = 'Demitir um funcionario existente'
    ctrl.demitir(req,res)
});

export default router;