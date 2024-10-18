const dbUsers = require("../config/db.ts");
import { User } from "../types/types";
const bcryptUsers = require('bcrypt');
class users {
    constructor(){

    }
    setLogin = (username:string,password:string)=>{
 
    }
}
exports.getLogin = (username:string,password:string): Promise<User[]> => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM admin WHERE username=?";
        dbUsers.query(sql, [username], async (err: Error | null, results: User[]) => {
            if (err) {
                return reject(err);
            }
            // Vérifier si l'utilisateur existe et comparer les mots de passe
            if (results.length === 0 || !(await bcryptUsers.compare(password, results[0].password))) {
                return results ;
            }

            const user: User = {
                id: results[0].id,
                username: results[0].username,
                role: results[0].role
            };
            resolve(results);
        })      
    });
}