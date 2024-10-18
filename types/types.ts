export interface Oeuvre {
    idWorks :string ;
    name:string;
}
export interface User {
    id: number;
    username: string;
    role: string;
    password?: string;
}