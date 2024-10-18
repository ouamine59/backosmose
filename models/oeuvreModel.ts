const dbOeuvres = require("../config/db.ts");
import { Oeuvre } from "../types/types";

exports.getOeuvreById = (id: number): Promise<Oeuvre[]> => {
  const sql = "SELECT * FROM works WHERE idWorks = ?";

  return new Promise((resolve, reject) => {
    dbOeuvres.query(sql, [id], (err: Error | null, results: any) => {
      if (err) {
        return reject(err);
      }

      const oeuvres: Oeuvre[] = results.map((elem: any) => ({
        idWorks: elem.idWorks,
        name: elem.name
      }));

      resolve(oeuvres);
    });
  });
};
