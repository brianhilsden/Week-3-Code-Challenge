const titleList = document.getElementById("films");
const poster = document.getElementById("poster");
const title = document.getElementById("title");
const runtime = document.getElementById("runtime");
const description = document.getElementById("film-info");
const showtime = document.getElementById("showtime");
const ticketsLeft = document.getElementById("ticket-num");
const buyTickets = document.getElementById("buy-ticket")
const numOfTicketsBought = document.getElementById("tickets_bought")
const filmUrl = "http://localhost:3000/films";


// Fetches and lists film titles from the server
function getFilmsData() {
  titleList.textContent = ""; //To remove the default list item first

  fetch(filmUrl)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((film) => {
        // Creates a list item for each film title, adds a cursor so it shows it's clickable
        const title = document.createElement("li");
        title.style.cursor = "pointer";
        title.id = film.id;
        title.classList.add("film", "item");

        // Setting innerHTML to display the film title in uppercase alongside a button to delete the entire list item
        title.innerHTML = `
            ${film.title.toUpperCase()}
            <button id="D${film.id}" style="background-color:#FF033E;color:white;border-radius:5px">Delete</button>
            `
        ;

        // Appending the created list item to the title list
        titleList.appendChild(title);

        //Use the film data and pass it as arguments to the functions
        displaySpecificMovieDetails(film);
        deleteSpecificMovie(film);
      });
      /*gets the data for the first available film and passes it into the firstFilm function, to use in displaying it when the page first loads. The id may not be 1 if some films were deleted, hence why I did not use the get endpoint with an id of 1*/
      firstFilm(data[0]);
    }).catch(error=>{
      alert(`Error: ${error.message}`)
    });
}
// Calling the function to fetch all film data and display film titles
getFilmsData();


/* This re-usable function updates the displayed movie information when called*/
function populateMovieData(film) {
  ticketsLeft.textContent = `${film.capacity - film.tickets_sold}`;
  poster.src = film.poster;
  poster.alt = film.title;
  title.textContent = film.title;
  runtime.textContent = `${film.runtime} minutes `;
  description.textContent = film.description;
  showtime.textContent = film.showtime;

  numOfTicketsBought.max = ticketsLeft.textContent // Sets the maximum value of tickets that can be bought to the number of tickets left

  // Calculates and displays the remaining tickets by subtracting tickets sold from capacity
  buyTickets.textContent = ticketsLeft.textContent > 0 ? "Buy Tickets" : "SOLD OUT"; // Sets button text based on ticket availability

  purchaseFilmTickets(film); // Calls the function to handle film ticket purchase and passes the arguments of current film object
}

// Calls populateMovieData to initialize the display with the first film's details
function firstFilm(firstFilmData) {
  populateMovieData(firstFilmData);
}

function displaySpecificMovieDetails(film) {
 
  // Gets the film title list item by its id and adds a click event to populate its data
  const displayMovie = document.getElementById(film.id);
  displayMovie.addEventListener("click", () => {
    numOfTicketsBought.value=1 // Sets the number of tickets being bought to 1 by default
    populateMovieData(film);
  });
}


//Deletes movie when button is pressed
function deleteSpecificMovie(film) {
  const deleteButton = document.getElementById(`D${film.id}`);
  deleteButton.addEventListener("click", () => {

    //Confirm prompt to avoid unintended film deletion
    if(confirm(`Warning! This will completely remove ${film.title} from the database. Kindly confirm`)){
      fetch(`${filmUrl}/${film.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => console.log(data))
        .catch((e) => {
          alert(`Error: ${e.message}`);
        });
    }
   
  });
}

//uses current film object to 
function purchaseFilmTickets(film) {

  buyTickets.onclick = function () {
    
    
   
    if (ticketsLeft.textContent > 0) {
      ticketsLeft.textContent=parseInt(ticketsLeft.textContent)-parseInt(numOfTicketsBought.value); // Decrementing the number of tickets left
      console.log(ticketsLeft.textContent);
      film.tickets_sold=parseInt(film.tickets_sold)+parseInt(numOfTicketsBought.value); // Incrementing the number of tickets sold
      // Creating an object to send the updated tickets sold count to the server
      const ticketData = {
        tickets_sold: film.tickets_sold, // Document update to ticket counts
      };
      // Sending a PATCH request to the server to update the tickets sold count for the current film
      fetch(`${filmUrl}/${film.id}`, {
        method: "PATCH", //
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Converting the ticketData object into a JSON string to send as the request body
        body: JSON.stringify(ticketData),
      })
        .then((res) => res.json())
        // After receiving the response, updating the display of remaining tickets for the current film and button
        .then((data) => {
          ticketsLeft.textContent = `${data.capacity - data.tickets_sold}`;
          numOfTicketsBought.max = ticketsLeft.textContent // Sets the maximum value of tickets that can be bought to the number of tickets left

          if (ticketsLeft.textContent == 0) {
            buyTickets.textContent = "SOLD OUT";
            document.getElementById(film.id).classList.add("sold-out"); // Adds sold-out class to the film's element if tickets are sold out
          }
        })
        .catch((e) => {
          alert(`Error: ${e.message}`);
        });

      //POST request to add bought ticket(s) to the tickets endpoint
      fetch("http://localhost:3000/tickets", {
        method: "POST",
        headers: {
          // Headers sent with the request
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          film_id: film.id, // Includes the current film's ID to identify which film the tickets are for
          tickets: numOfTicketsBought.value, // Number of tickets being purchased
        }),
      })
        .then((res) => console.log(res.json()))
        .catch((e) => {
          alert(`Error: ${e.message}`); // Alerts the user in case of an error
        });
    }
  };
}
