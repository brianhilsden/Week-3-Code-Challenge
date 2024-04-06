const titleList = document.getElementById("films");
const poster = document.getElementById("poster");
const title = document.getElementById("title");
const runtime = document.getElementById("runtime");
const description = document.getElementById("film-info");
const showtime = document.getElementById("showtime");
const ticketsLeft = document.getElementById("ticket-num");
const buyTickets = document.querySelector("div button")
const filmUrl = "http://localhost:3000/films";

// Fetches and lists film titles from the server
function listTitles() {
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
        title.onclick = () => movieData(film); // Attaches an event listener to a title element to fetch movie data on click.

        // Setting innerHTML to display the film title in uppercase alongside a button to delete it upon click
        title.innerHTML = `
            ${film.title.toUpperCase()}
            <button onclick= "deleteItem(${film.id})" style="background-color:#FF033E;color:white;border-radius:5px">Delete</button>

        `;
        // Appending the created list item to the title list
        titleList.appendChild(title);
      });
      /*gets the data for the first available film and passes it into the firstFilm function, to use in displaying it when the page first loads. The id may not be 1 if some films were deleted, hence why I did not use the get endpoint with an id of 1*/
      firstFilm(data[0]);
    });
}
// Calling the function to fetch all film data and display film titles
listTitles();

// Calls movieData to initialize the display with the first film's details
function firstFilm(firstFilmData) {
  movieData(firstFilmData);
}

/* This re-usable function updates the displayed movie information when a movie is selected or first movie when the page loads*/
function movieData(film) {
  poster.src = film.poster;
  poster.alt = film.title;
  title.textContent = film.title;
  runtime.textContent = `${film.runtime} minutes `;
  description.textContent = film.description;
  showtime.textContent = film.showtime;
  // Calculates and displays the remaining tickets by subtracting tickets sold from capacity
  ticketsLeft.textContent = `${film.capacity - film.tickets_sold}`;
  console.log(film.tickets_sold);
  buyTickets.id = `B${film.id}`; // Sets the ID for the buy ticket button based on the current film ID
  buyTickets.textContent = ticketsLeft.textContent > 0 ? "Buy Ticket" : "SOLD OUT"; // Sets button text based on ticket availability

  purchaseFilmTickets(film,ticketsLeft.textContent); // Calls the function to handle film ticket purchase and passes the arguments or current film object and number of tickets remaining.
}

// Remove a film by its ID upn click of the delete button
function deleteItem(id) {
  fetch(`${filmUrl}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((e) => {
      alert(e);
    });
}
function purchaseFilmTickets(film,ticketsRemaining) {
  // Directly pass the film data to the event listener function
  const buyButton = document.getElementById(`B${film.id}`);

  buyButton.onclick = function () {
    ticketsRemaining--; // Decrementing the number of tickets left

    if (ticketsRemaining >= 0) {
      film.tickets_sold++; // Incrementing the number of tickets sold
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
          buyTickets.textContent = ticketsRemaining === 0 ? "SOLD OUT" : "Buy Ticket";
        })
        .catch((e) => {
          alert(e);
        });

      fetch("http://localhost:3000/tickets", {
        method: "POST",
        headers: {
          // Headers sent with the request
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          film_id: film.id, // Includes the current film's ID to identify which film the tickets are for
          tickets: 1, // Number of tickets being purchased
        }),
      })
        .then((res) => console.log(res.json()))
        .catch((e) => {
          alert(e); // Alerts the user in case of an error
        });
    }
  };
}
