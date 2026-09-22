import Database from "../db/database.js";
import RhEntity from "../entities/rhEntity.js";

export default class RhRepository{
    #banco;

    set banco(value){
        this.#banco = value;
    }

    constructor(){
        this.#banco = new Database();
    }

    async autenticar(email,senha){
        let sql = "select * from tb_usuariorh where usu_email = ? and usu_senha = ? and usu_ativo = 1";
        let valores = [email,senha];

        let rows = await this.#banco.ExecutaComando(sql, valores);
        if(rows && rows.length > 0){
            return RhEntity.toMap(rows[0]);
        }

        return null;
    }
}