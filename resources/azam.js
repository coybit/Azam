
var movies = [];

var idx = lunr(function () {
    this.field('title', { boost: 10 })
    this.field('plot')
    this.field('genre')
    this.field('actors')
    this.field('director')
    this.field('year')
})

$(function() {

    $('.search-box').focus();

    $.get( 'out.json', function(res) {

        movies = prepare(res);
        searchDidRequest();

    })


    ///////// Event Handlers
    $('.search-box').on('keyup', function() {
        searchDidRequest();
    });

    $('.sort-label').click( function() {
        $('.sort-label').toggleClass('active');
        searchDidRequest();
    });
    
})

///////// Utilities

function movieIsClicked() {
    $(this).find('.movie-more').toggle();
}

function searchDidRequest() {
    var term = $('.search-box').val().toLowerCase();
    var sort = $('.sort-label').hasClass('active');

    ga('send', 'event', 'search', term, sort);

    setTimeout( function() {
        search(term, sort, movies)
    }, 0);
}

function prepare(rawList) {

    var list = rawList.map(function(movie){

        // Extract Rate
        var rate = [0];
        if( movie.info.Ratings ) {
            rate = movie.info.Ratings.filter(function(rate){
                return rate.Source == "Internet Movie Database"
            }).map( function(rate) { return rate.Value });
        }

        if( rate.length == 0 ) {
            rate = [0];
        }

        // Map
        return {
            "title": movie.info.Title,
            "rate": rate[0],
            "image": movie.info.Poster,
            "genre": movie.info.Genre,
            "plot": movie.info.Plot,
            "director": movie.info.Director,
            "actors": movie.info.Actors,
            "year": movie.info.Year,
            "id": movie.info.imdbID
        }
    }).filter( function(movie) {
        return movie.title != null;
    });

    list.forEach( function(item,index) {

        var doc = {
            "title": item.title,
            "plot": item.plot,
            "director": item.director,
            "genre": item.genre,
            "actors": item.actors,
            "year": item.year,
            "id": item.id
        }
        idx.add(doc);

    });

    return list;
}

function search(term,sort,movies) {

    $('#list').html('').hide();
    $('.loader').show();

    var results;

    if( term == '' ) { // Show all movies
        results = movies;
    }
    else {
        results = idx.search(term).map( function(result) {

            var movie = movies.filter( function(movie){
                return result.ref == movie.id;
            })[0];

            return movie;

        });
    }

    if( sort ) {
        results.sort( function(a,b) {
            var rateA = parseFloat( a.rate );
            var rateB = parseFloat( b.rate );
            return rateB - rateA;
        })
    }
    else {
        results.sort( function(a,b) {
            var titleA = a.title.toLowerCase();
            var titleB = b.title.toLowerCase();
            return titleA.localeCompare(titleB);
        })
    }

    results.forEach( function(movie) {

        var subtitleLink = 'https://subscene.com/subtitles/title?q=' + movie.title

        var elmImage = $('<img>').addClass('movie-image').attr('src',movie.image);
        var elmTitle = $('<span>').addClass('movie-title').text(movie.title);
        var elmScore = $('<span>').addClass('movie-rate').text(movie.rate);
        var elmGenre = $('<span>').addClass('movie-genre').text(movie.genre);
        var elmPlot = $('<span>').addClass('movie-plot').text(movie.plot);
        var elmMore = $('<div>').addClass('movie-more').html('Director: ' + movie.director + '<br/>Actors: ' + movie.actors + '</br><a target="_blank" href=\"' + subtitleLink + '\">Subtitle</a>');

        var elm = $('<div>').addClass('movie clearfix')
        .append(elmImage)
        .append(elmTitle)
        .append(elmScore)
        .append(elmGenre)
        .append(elmPlot)
        .append(elmMore);

        elm.click(movieIsClicked);
        elm.find('a').click( function(event){
            event.stopPropagation();
        });

        $('#list').append( elm );

    });

    $('.loader').hide();
    $('#list').show();

    var n = results.length;
    if( n == 0 ) {
        $('.stat').text( 'no result' );
    }
    else if( n == 1) {
        $('.stat').text( 'just one movie is found' );
    }
    else {
        $('.stat').text( results.length + ' movies are found' );
    }
}
