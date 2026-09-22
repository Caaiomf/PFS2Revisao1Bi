export default class Entity{
    constructor(){

    }
    toJSON(){
        let props = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        let json = {};
        for(let prop of props){
            json[prop] = this[prop]
        }
        return json;
    }
}