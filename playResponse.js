const polka = require('polka');
const { raw } = require('body-parser');
const fs = require('fs');



function setupAndListen(waitCallback, playbackCallback){



    const app =  polka();
    var c = 0;
    const PORT = process.env.PORT || 3444;

    //app.use(raw({ limit: 50000 }));
    app.get("/", (req,res)=> {
        console.log("recieved")
        res.end();
    });
    app.post("/", (req,res)=>{

        console.log("recieved")
        let file = fs.createWriteStream("audio.wav");
        let body = '';
        req.on('data', (chunk) => {
            file.write(chunk);
        
        });
        req.on('end', () => {
            console.log(body);
        file.close();
        waitCallback();
        playbackCallback();
        res.end();
        
        });


    
    

    });

    app.listen(PORT,function () {
        console.log('started listening on port ' + PORT);
    });
}

module.exports = {
     
    setupAndListen
}