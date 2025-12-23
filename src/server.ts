
import * as express from 'express';
import { root } from './route/root';

const app = express();

function setupExpress(){
    
    app.route("/").get(root);


}

function startServer(){
    app.listen(9000,()=>{
        console.log("Server is running on http://localhost:9000");
    })
}

setupExpress();
startServer();