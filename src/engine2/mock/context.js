let context;

export function resolveContext(){
    if(!context){
        context = new AudioContext();
    }
    return context;
}