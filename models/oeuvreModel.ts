const dbOeuvres = require( "../config/db.ts" )
exports.postOneOeuvre = (id:number)=>{
    const sql ="SELECT * FROM works WHERE idWorks = ?";
    dbOeuvres.query(sql, [id  ], async (err: Error | null, results : any)=>{
        return results ;
    })       
}