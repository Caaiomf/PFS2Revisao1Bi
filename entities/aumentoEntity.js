import Entity from "./entity.js";



export default class AumentoEntity extends Entity{

    #id;
    #data;
    #percentual;
    #usuarioId;

    get id(){ return this.#id; }
    set id(value){this.#id = value; }

    get data(){ return this.#data; }
    set data(value) { this.#data = value; }
    
    get percentual(){ return this.#percentual; }
    set percentual(value){ this.#percentual = value; }

    get usuarioId(){ return this.#usuarioId;}
    set usuarioId(value){ this.#usuarioId = value;}

    constructor(id, data, percentual, usuarioId){
        super();
        this.#id = id;
        this.#data = data;
        this.#percentual = percentual;
        this.#usuarioId = usuarioId;
    }

    validar(){
        if(!this.#percentual || this.#percentual <= 0)
            return false;
        if(!this.#usuarioId ||this.#usuarioId <= 0)
            return false;

        return true;
    }

    static toMap(row){
        return new AumentoEntity(
            row["aus_id"],row["aus_data"], row["aus_percentual"], row["usu_id"]
        );
    }
}