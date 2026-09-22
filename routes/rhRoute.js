import express from "express";
import RhController from "../controllers/rhController.js";


const router = express.Router();

const ctrl = new RhController();

router.post("/login", (req,res) => {
    //#swagger.tags = ['RH']
    //#swagger.summary = 'Efetuar login e obter token JWT'
    ctrl.login(req,res);
});

export default router;