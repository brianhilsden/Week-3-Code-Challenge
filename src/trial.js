document.addEventListener('DOMContentLoaded', () => {
    const filmsList = document.getElementById('films');
    const movieTitle = document.getElementById('title');
    const movieRuntime = document.getElementById('runtime');
    const movieDescription = document.getElementById('film-info');
    const movieShowtime = document.getElementById('showtime');
    const availableTickets = document.getElementById('ticket-num');
    const moviePoster = document.getElementById('poster');
    const buyTicketButton = document.getElementById('buy-ticket');
  
    // Function to fetch movie list from the server and populate the menu
    function fetchAndPopulateMovieList() {
      fetch('http://localhost:3000/films')
        .then(response => response.json())
        .then(films => {
          films.forEach(film => {
            const filmItem = document.createElement('li');
            filmItem.classList.add('film', 'item');
            filmItem.innerHTML = `
            ${film.title}
            <button id=${film.id}>Delete</button>
            
            `
            filmsList.appendChild(filmItem);
            deleteMovie(film)

            if ((film.capacity-film.tickets_sold) == 0) {
                filmItem.classList.add("sold-out"); // Mark the film as sold out by adding "sold-out" class
              }
            // Add click event listener to each film item
            filmItem.addEventListener('click', () => {
              fetchAndDisplayMovieDetails(film);
            });
                firstMovieData(films[0]) // Display the first movie's data when the page loads or movie list is updated.
          });
        })
        .catch(error => {
          console.error('Error fetching movie list:', error);
        });
    }

    function firstMovieData(movie){
            // Populates the first movie details on the page using the given movie object
        movieTitle.textContent = movie.title;
        movieRuntime.textContent = movie.runtime + ' minutes';
        movieDescription.textContent = movie.description;
        movieShowtime.textContent = movie.showtime;
        availableTickets.textContent = movie.capacity - movie.tickets_sold;
        moviePoster.src = movie.poster;
        buyTicket(movie) // Calls the function to handle ticket purchasing for a specified movie object
    }
    
    
  
    // Function to fetch and display movie details based on film ID
    function fetchAndDisplayMovieDetails(film) {
        
      fetch(`http://localhost:3000/films/${film.id}`)
        .then(response => response.json())
        .then(movie => {
          // Update movie details in the DOM
          movieTitle.textContent = movie.title;
          movieRuntime.textContent = movie.runtime + ' minutes';
          movieDescription.textContent = movie.description;
          movieShowtime.textContent = movie.showtime;
          availableTickets.textContent = movie.capacity - movie.tickets_sold;
          moviePoster.src = movie.poster;
           
            
          // Update Buy Ticket button text and disabled state based on availability
          if (movie.capacity - movie.tickets_sold === 0) {
            buyTicketButton.textContent = 'Sold Out';
            buyTicketButton.disabled = true;
          } else {
            buyTicketButton.textContent = 'Buy Ticket';
            buyTicketButton.disabled = false;
          }
        })
        .catch(error => {
          console.error('Error fetching movie details:', error);
        });

        buyTicket(film) // Call the buyTicket function with the selected film object as its argument
    }
  
    // Function to handle buying tickets
    function buyTicket(movie) {
        // Add event listener to Buy Ticket button
        buyTicketButton.onclick=() => {
                movie.tickets_sold++ // Increment tickets sold count by 1
                
                // Pass the movie object to buyTicket function
                fetch(`http://localhost:3000/films/${movie.id}`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      tickets_sold: movie.tickets_sold
                    })
                  })
                    .then(response => response.json())
                    .then(updatedMovie => {
                      availableTickets.textContent = updatedMovie.capacity - updatedMovie.tickets_sold;
                      if (parseInt(availableTickets.textContent) === 0) {
                        buyTicketButton.textContent = 'Sold Out';
                        buyTicketButton.disabled = true;
                      }
                    })
                    .catch(error => {
                      console.error('Error buying ticket:', error);
                    });

                    fetch("http://localhost:3000/tickets", {
                        method: "POST",
                        headers: {
                        "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            film_id: movie.id, // ID of the movie for which the ticket is being bought
                            tickets: 1, // Number of tickets being bought, fixed at 1 for now
                        }),
                        })
                        .then((res) =>res.json()) // Convert the response to JSON format
                        .catch(error => {
                            console.error('Error fetching movie list:', error);
                          });
             
               };
       
     
    }
    function deleteMovie(film){
        const deleteBtn = document.getElementById(film.id) // Get the delete button for the film
  
        deleteBtn.addEventListener("click", () => {
            fetch(`http://localhost:3000/films/${film.id}`, { // Send a DELETE request to the server for the film
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                  },
                })
            .catch(error => {
                 console.error('Error fetching movie list:', error);
                  });
            });
  
      }
  
    // Call the function to fetch and populate movie list when the page loads
    fetchAndPopulateMovieList();
  });

   