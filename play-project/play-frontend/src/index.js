(function () {

  const BACKEND_URL = 'http://localhost:3000';

  let mainDiv = document.querySelector('[data-id="game-con"]')
  let chatWindow = document.querySelector('[data-id="chat-window"]')
  let current_player = {}
  let gamesReference
  let playersReference

  const pongButton = document.createElement('button')
  pongButton.className = "game-button" 
  pongButton.textContent = "Ping Pong"

  const foosballButton = document.createElement('button')
  foosballButton.className = "game-button"
  foosballButton.textContent = "Foosball" 

  const shuffleboardButton = document.createElement('button')
  shuffleboardButton.className = "game-button" 
  shuffleboardButton.textContent = "Shuffleboard" 

  const liveChatButton = document.createElement('button')
  liveChatButton.className = "other-button" 
  liveChatButton.textContent = "Live Chat" 

  const leaderButton = document.createElement('button')
  leaderButton.className = "other-button" 
  leaderButton.textContent = "Leaderboard" 

  const topDiv = document.querySelector('.top')

  const signInForm = document.querySelector('.user-form')

  fetchGames()
  fetchPlayers()
  listenForGameSelection()
  listenForJoin()
  listenForSignIn()
  
  function fetchGames() {
    fetch(`${BACKEND_URL}/games`)
    .then(response => 
      response.json())
    .then(data => {
      gamesReference = data
    })
  }

  function fetchPlayers() {
    fetch(`${BACKEND_URL}/players`)
  .then(response => 
    response.json())
  .then(data => {
    playersReference = data
  })
  }
  



  function ifSignedIn() {
    topDiv.append(pongButton, foosballButton, shuffleboardButton, liveChatButton, leaderButton) 
    mainDiv.className = "post-sign-in"
    chatWindow.className = "chat"
    mainDiv.innerHTML = `
    <h1>Hey ${current_player.name}</h1>
    <h2>What do you want to Play?</h2>
    `
    

  }

  function listenForSignIn() {
    signInForm.addEventListener('submit', event => {
      event.preventDefault()
      const userInput = event.target.username.value
      const existingUser = playersReference.data.find(player => player.attributes.name === userInput)
      if (existingUser) {
        current_player.id = existingUser.id
        current_player.name =  existingUser.attributes.name
        ifSignedIn()
      } else {
        fetch(`${BACKEND_URL}/players`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            name: userInput
          })
        })
        .then(res => res.json())
        .then(data => {
          current_player.id = data.id
          current_player.name = data.name
          ifSignedIn()
        })
      }
    })
  }




  function listenForGameSelection() {
    topDiv.addEventListener('click', event => {
      if (event.target.textContent === "Ping Pong" || event.target.textContent === "Shuffleboard" || event.target.textContent === "Foosball") {
        let game_type = event.target.textContent
        let games = gamesReference.data.filter(game => game.attributes.table.table_type === game_type && game.attributes.full === false)
        mainDiv.innerHTML = `<h2> ${games[0].attributes.table.table_type}</h2> ${games.map(game => renderGame(game)).join('')}`
      }
    })
  }

  function renderGame(game) {
    return `<div class="game-div" data-id="game-div-${game.id}">
    <h4>${game.attributes.num_players / 2} v ${game.attributes.num_players / 2}</h4>
    <button data-id="${game.id}"> Join </button>
    <ul>${renderJoins(game.attributes.players)}</ul>
    </div>`
  }

  function renderJoins(join_array) {
    return join_array.map(player => {
      return `<li>${player.name}</li>`
    }).join('')
  }

  function listenForJoin() {
    mainDiv.addEventListener('click', event => {
      if (event.target.textContent === " Join ") {
        
        let chosenGame = gamesReference.data.find(game => {
          return game.id === event.target.dataset.id
        })
        if (chosenGame.attributes.players.length < chosenGame.attributes.num_players) {
          let playersUl = event.target.nextElementSibling
          let playersList = playersUl.querySelectorAll("li")
          let existingName = false
          for(let i = 0; i < playersList.length; i++) {
            if (playersList[i].textContent === current_player.name) {
              existingName = true
            }
          }
          // playersList.find(player => player.textContent === current_player.name)
          if (!existingName) {
            
            if (chosenGame.attributes.players.length === chosenGame.attributes.num_players - 1) {
          
              createPlayerGame(chosenGame, true)
              // need to build - updateFullValue(chosenGame)
              renderNewGame(chosenGame)
            } else {
              createPlayerGame(chosenGame, false)
            }
            
          }
        } else {
          alert("Game is full. Try again later.")
        }
      } else if (event.target.textContent === " Leave ") {
        deletePlayerGame(event.target)
      }
    })
  }

  function deletePlayerGame(leaveButton) {
    fetch(`${BACKEND_URL}/player_games/${leaveButton.dataset.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
    })
    .then(res => {
      const playersUl = leaveButton.nextElementSibling
      const playersListItems = playersUl.querySelectorAll('li')
      for(let i = 0; i < playersListItems.length; i++) {
        if (playersListItems[i].textContent === current_player.name) {
          playersListItems[i].remove()
          leaveButton.textContent = " Join "
          leaveButton.dataset.id = leaveButton.parentElement.dataset.id.split('-')[2]
          fetchGames()
        }
      }

    })
  }

  function renderNewGame(game) {
    fetch(`${BACKEND_URL}/games`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        table_id: game.attributes.table.id,
        num_players: game.attributes.num_players,
        full: false
      })
    })
    .then(res => res.json())
    .then(data => {
      fetchGames()
      const replacedGame = document.querySelector(`[data-id="game-div-${game.id}"]`)
      setTimeout(function(){
        updateFull(game.id)
        // replacedGame.dataset.id.split('-')[2]
        replacedGame.dataset.id = `game-div-${data.id}`
        replacedGame.querySelector('ul').innerHTML = ""
        replacedGame.querySelector('button').textContent = " Join "
        replacedGame.querySelector('button').dataset.id = data.id
      }, 3000)
      
    })
  }

  function updateFull(id) {
    fetch(`${BACKEND_URL}/games/${id}`, {
      method: 'PATCH',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        full: true
      })
    })
  }

  function createPlayerGame(chosenGame, boolean) {
    fetch(`${BACKEND_URL}/player_games`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        game_id: chosenGame.id,
        player_id: current_player.id
      })
    })
    .then(response => response.json())
    .then(pg => {
      const gameChoice = document.querySelector(`[data-id="game-div-${pg.data.attributes.game.id}"]`)
      const ul = gameChoice.querySelector('ul')
      const gameButton = gameChoice.querySelector('button')
      if (boolean) {
        gameButton.textContent = " Game in Session "
        setTimeout(function(){alert("Ready to Play!")}, 1000)
      } else {
        gameButton.textContent = " Leave "
      }
      gameButton.dataset.id = pg.data.id
      ul.innerHTML += renderJoins([pg.data.attributes.player])
      fetchGames()
    })
  }
  



})();