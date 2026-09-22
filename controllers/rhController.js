import AuthMiddleware from "../middlewares/authMiddleware.js";
import RhRepository from "../repositories/rhRepository.js";



export default class RhController{
    #repo;
    #auth;

    constructor(){
        this.#repo = new RhRepository();
        this.#auth = new AuthMiddleware();
    }

    async login(req,res){
        try{
            let {email, senha} = req.body;

            if(!email || !senha){
                return res.status(400).json({ msg: "Email e senha sao obrigatorios!"});
            }

            let usuario = await this.#repo.autenticar(email,senha);

            if(usuario){
                let token = this.#auth.gerarToken(usuario.id, usuario.nome, usuario.email);

                res.cookie("token", token, {httpOnly: true});

                return res.status(200).json({
                    msg: "Login realizado com sucesso!",
                    token: token
                });
            }else {
                return res.status(401).json({ msg: "Email ou senha incorretos ou usuario inativo!"});
            }
        }catch(ex){
            console.log(ex);
            return res.status(500).json({msg: "erro interno no servidor"});
        }
    }
}