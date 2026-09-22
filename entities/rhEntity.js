import Entity from "./entity.js";

export default class RhEntity extends Entity{
    #id;
    #nome;
    #email;
    #ativo;
    #senha;

    get id() {return this.#id; }
    set id(value) {this.#id = value; }

    get nome() {return this.#nome; }
    set nome(value) {this.#nome = value;}

    get email() {return this.#email;}
    set email(value) { this.#email = value;}

    get ativo() {return this.#ativo;}
    set ativo(value) {this.#ativo = value;}

    get senha() {return this.#senha;}
    set senha(value) {this.#senha = value;}

    constructor(id, nome, email, ativo, senha){
        super();
        this.#id = id;
        this.#nome = nome;
        this.#email = email;
        this.#ativo = ativo;
        this.#senha = senha;
    }

    static toMap(row){
        return new RhEntity(
            row["usu_id"], row["usu_nome"], row["usu_email"], row["usu_ativo"], row["usu_senha"]
        );
    }
}