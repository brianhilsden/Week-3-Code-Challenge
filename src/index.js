const titleList = document.getElementById("films");
const poster = document.getElementById("poster");
const title = document.getElementById("title");
const runtime = document.getElementById("runtime");
const description = document.getElementById("film-info");
const showtime = document.getElementById("showtime");
const ticketsLeft = document.getElementById("ticket-num");
const buyTickets = document.getElementById("buy-ticket");
const filmUrl = "http://localhost:3000/films";
let currentFilmId;
let currentFilmTicketsSold;
let currentFilmTicketsLeft;

// Fetches and lists film titles from the server
function listTitles() {
  titleList.textContent = ""; //To remove the default list item first
  fetch(filmUrl)
    .then((res) => res.json())
    .then((data) =>{
      data.forEach((film) => {
        // Creates a list item for each film title, adds a cursor so it shows it's clickable
        const title = document.createElement("li");
        title.style.cursor = "pointer";
        title.id = film.id;
        title.classList.add("film", "item");
        title.onclick=()=>movieData(film) // Attaches an event listener to a title element to fetch movie data on click.

        // Setting innerHTML to display the film title in uppercase alongside a button to delete it upon click
        title.innerHTML = `
            ${film.title.toUpperCase()}
            <button onclick= "deleteItem(${film.id},'${film.title}')" style="border-radius: 5px;background-color:#D2122E;color:white">Delete</button>

        `;
        // Appending the created list item to the title list
        titleList.appendChild(title);
       
      });
      
      movieData(data[0]) // Invokes movieData with the first film in the data array to initialize the page with film details.
    });
}
// Calling the function to fetch all film data and display film titles
listTitles();

/* This re-usable function updates the displayed movie information when a movie is selected or first movie when the page loads*/
function movieData(film){

  poster.src = film.poster;
  poster.alt = film.title;
  title.textContent = film.title;
  runtime.textContent = `${film.runtime} minutes `;
  description.textContent = film.description;
  showtime.textContent = film.showtime;
  // Calculates and displays the remaining tickets by subtracting tickets sold from capacity
  ticketsLeft.textContent = `${film.capacity - film.tickets_sold}`;

  // Updates the current film ID and tickets sold for use in the buy ticket functionality
  currentFilmId = film.id; // Stores the ID of the currently selected film
  currentFilmTicketsSold = film.tickets_sold; // Stores the number of tickets sold for the currently selected film
  currentFilmTicketsLeft = ticketsLeft.textContent; //store the content of ticketsLeft in global

  buyTickets.textContent = currentFilmTicketsLeft > 0 ? "Buy Ticket" : "SOLD OUT"; // Sets button text based on ticket availability
}


  // Remove a film by its ID upn click of the delete button
function deleteItem(id,filmTitle) {
   //Confirm dialog before actually deleting the item
  if (confirm(`Warning! This will remove ${filmTitle} entirely from the database. Kindly confirm`)){
    fetch(`${filmUrl}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => console.log(data))
      .catch(e=>{
        alert(e)
      });
  }
 
}



// Event listener for the buy ticket button
buyTickets.addEventListener("click", () => {
  currentFilmTicketsSold++; // Incrementing the number of tickets sold
  currentFilmTicketsLeft--; // Decrementing the number of tickets left
  if (currentFilmTicketsLeft >= 0) {
    // Creating an object to send the updated tickets sold count to the server
    const ticketData = {
      tickets_sold: currentFilmTicketsSold, // Document update to ticket counts
    };
    // Sending a PATCH request to the server to update the tickets sold count for the current film
    fetch(`${filmUrl}/${currentFilmId}`, {
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
        buyTickets.textContent = currentFilmTicketsLeft === 0 ? "SOLD OUT" : "Buy Ticket";
      })
      .catch(e=>{
        alert(e)
      });

              fetch("http://localhost:3000/tickets",{
                method:"POST", 
                headers:{ // Headers sent with the request
                  "Content-Type":"application/json", 
                  "Accept":"application/json" 
                },
                body:JSON.stringify({ 
                  film_id:currentFilmId, // Includes the current film's ID to identify which film the tickets are for
                  tickets:1 // Number of tickets being purchased
                })
              }).then(res=>console.log(res.json())) 
              .catch(e=>{
                alert(e) // Alerts the user in case of an error
              })
  }
});