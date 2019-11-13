(function () {

  const BACKEND_URL = 'http://localhost:3000';

  let mainDiv = document.querySelector('main')

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

  const sideNavDiv = document.querySelector('.side-nav')
  sideNavDiv.append(pongButton, foosballButton, shuffleboardButton, liveChatButton, leaderButton)
  
  listenForGameSelection()
  listenForJoin()

  fetch(`${BACKEND_URL}/games`)
    .then(response => 
      response.json())
    .then(data => {
      gamesReference = data
    })

  fetch(`${BACKEND_URL}/players`)
  .then(response => 
    response.json())
  .then(data => {
    playersReference = data
  })

  // fetch(`${BACKEND_URL}/tables`)
  // .then(response => 
  //   response.json())
  // .then(data => {
  //   gamesReference = data
  // })


  function listenForGameSelection() {
    sideNavDiv.addEventListener('click', event => {
      
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
debugger
        if (chosenGame.attributes.players.length < chosenGame.attributes.num_players) {
          createPlayerGame(chosenGame)
        } else {
          alert("Game is full. Try again later.")
        }
      }
    })
  }


  // const current_player = playersReference.find(player => {
  //   player.name === form.name.value
  // })

  function createPlayerGame(chosenGame) {
    fetch(`${BACKEND_URL}/player_games`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        game_id: chosenGame.id,
        player_id: 2 
      })
    })
    .then(response => response.json())
    .then(pg => {
      const gameChoice = document.querySelector(`[data-id="game-div-${pg.data.attributes.game.id}"]`)
      const ul = gameChoice.querySelector('ul')
      ul.innerHTML += renderJoins([pg.data.attributes.player])
      let refGame = gamesReference.data.find(game => parseInt(game.id) === pg.data.attributes.game.id)
      refGame.attributes.players.push(pg.data.attributes.player)
    })
  }

  // pg.data.attributes.game.id


})();