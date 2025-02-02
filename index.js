const express = require('express')
const app = express()
app.use(express.json())
const jwt = require('jsonwebtoken');
const path = require('path')
const {Schema,model, default: mongoose} = require('mongoose');
mongoose.connect('mongodb+srv://xachatryanarman067:Armkvas275@cluster0.fyi39.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected!')).catch((err) => console.log('database error'));

const AutoIncrement = require('mongoose-sequence')(mongoose);
const schema = new Schema({
    _id: Number,
    player1: String,
    player2: String,
    player1Choice: String, // Fixed spelling
    player2Choice: String, // Fixed spelling
    isGameFinished: { type: Boolean, default: false },
    result: String
}, { timestamps: true });
schema.plugin(AutoIncrement, { inc_field: '_id' });
const Game = model('game',schema)


function ValidateToken(req,res,next){
  const authHeader = req.headers['authorization'];
  const token = authHeader;
  
  if (!token) {
      return res.status(401).json({ message: 'token missing' });
  }
  const decoded = jwt.verify(token,'secret')
  req.username = decoded.username
  next()
}

async function play(req, res) {
    const { choice } = req.body; // Fixed spelling
    console.log(choice);
    
    const username = req.username;
  
    const game = await Game.findOne({
        isGameFinished: false,
        player1: { $ne: username }
    });
  
    if (game) {
        game.player2 = username;
        game.player2Choice = choice; // Fixed spelling
  
        const result = determineWinner(game.player1Choice, choice);
        if (result === "player1") {
            game.result = `${game.player1} won`;
        } else if (result === "player2") {
            game.result = `${game.player2} won`;
        } else {
            game.result = "draw";
        }
        game.isGameFinished = true;
        await game.save();
        return res.status(200).json(game);
    }
  
    const newGame = await Game.create({
        player1: username,
        player1Choice: choice, // Fixed spelling
    });
  
    return res.status(200).json(newGame);
}

app.post('/play',ValidateToken,play)

app.post('/login', function (req, res) {
    
    
    const {username} = req.body
    const token = jwt.sign({ username: username }, 'secret',{expiresIn:'8h'});
    return res.status(200).json({token:token})
    
    
})


async function finishedGames(req,res,next) {
    
    
    
    const username = req.username 
    // console.log(username);
    
    const finishedGames = await Game.find(
      {
        $and:[
            {isGameFinished:true},
            {$or:[
                {player1:username},
                {player2:username}
            ]}
        ] 
    }
    )    
    // console.log(finishedGames);
    
    return res.status(200).json(finishedGames)
}

async function notFinishedGames(req,res) {
    const username = req.username
   
    
    
    const Games = await Game.find(
      {
        $and:[
            {isGameFinished:false},
            {$or:[
                {player1:username},
                {player2:username}
            ]}
        ] 
    }
    )
    console.log(Games);
    
    
    
    return res.status(200).json(Games)
}

app.get('/finishedGames',ValidateToken,finishedGames)
app.get('/notFinishedGames',ValidateToken,notFinishedGames)
function determineWinner(player1, player2) {
  if (player1 === player2) {
      return "draw";
  }

  if (
      (player1 === "rock" && player2 === "scissors") ||
      (player1 === "scissors" && player2 === "paper") ||
      (player1 === "paper" && player2 === "rock")
  ) {
      return "player1";
  } else {
      return "player2";
  }
}
app.get('/login',(req,res) => {
    return res.sendFile(path.join(__dirname,'login.html'))
})
app.get('/',(req,res) => {
    return res.sendFile(path.join(__dirname,'index.html'))
})
app.listen(3000)

