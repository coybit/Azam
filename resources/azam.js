
var movies = [];
var similars = [];
var idx = lunr(function () {
    this.field('title', { boost: 10 })
    this.field('plot')
    this.field('genre')
    this.field('actors')
    this.field('director')
    this.field('year')
    this.field('similars')
})



Array.prototype.flatMap = function(lambda) { 
    return Array.prototype.concat.apply([], this.map(lambda)); 
};

function getSimilarMovieTo(movieID) {

    $.get('https://api.themoviedb.org/3/movie/' + movieID + '/similar?api_key=3304aafd7690a315c7faddd3b6b4ba0e&language=en-US&page=1', function(res) {

        similars.push({'id': movieID, 'similar': res});

    })

}

$(function() {

    var query = queryStringToJSON().q;

    $('.search-box').focus().val(query);

    $.get( 'data/out.json', function(resMovies) {

        
         $.get( 'data/similars.json', function(resSimilars) {

            movies = prepare(resMovies);
            prepareSimilarMovieTags(resSimilars);

            searchDidRequest();
         });

        // movies.forEach( function(movie, idx) {

        //     console.log(idx * 250);

        //     setTimeout( function() {
        //         getSimilarMovieTo(movie.id);
        //     }, 250 * idx)

        // });
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

function prepareSimilarMovieTags(rawList) {

    movies.forEach( function(movie) {

        var similarMovies = rawList.filter( function(m) {
            return m.id == movie.id;
        }).flatMap( function(m) {
            return m.similar.results;
        }).map( function(similar) {
            return similar.title;
        }).map( function(similar){

            var movie = movies.find( function(movie) {
                return movie.title.toLowerCase() == similar.toLowerCase();
            });

            return  { 
                'title': similar,
                'mid': (movie == null) ? null : movie.id
            }
        })

        movie['similars'] = similarMovies || [];

        var similarsTitle = similarMovies.map( function(similar) {  return similar.title });
        
        var doc = {
            "title": movie.title,
            "plot": movie.plot,
            "director": movie.director,
            "genre": movie.genre,
            "actors": movie.actors,
            "year": movie.year,
            "id": movie.id,
            "similars": similarsTitle.join(',')
        }
        idx.add(doc);

    });
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

/*
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
*/
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

    results.forEach( function(movie, idx) {

        var subtitleLink = 'https://subscene.com/subtitles/title?q=' + movie.title

        var elmImage = $('<img>').addClass('movie-image').attr('src',movie.image);
        var elmTitle = $('<span>').addClass('movie-title').text(movie.title);
        var elmScore = $('<span>').addClass('movie-rate').text(movie.rate);
        var elmGenre = $('<span>').addClass('movie-genre').text(movie.genre);
        var elmPlot = $('<span>').addClass('movie-plot').text(movie.plot);
        var elmSimilar = $('<div>').addClass('movie-similars');
        var elmMore = $('<div>').addClass('movie-more').html(
            'Director: ' + movie.director + '<br/>' +
            'Actors: ' + movie.actors + '</br>' + 
            '<a target="_blank" href=\"http://www.imdb.com/title/' + movie.id + '/\">Open IMDB</a> ' +
            '<a target="_blank" href=\"' + subtitleLink + '\">Find Subtitle</a>');

        setTimeout( function() {
            console.log(movie.title);

            //Similar Movies
            movie.similars.forEach( function(similar) {
                
                var elmSimilarMovie = $('<div>').addClass('movie-similar');
                var elmTitle = $('<a>').text(similar.title);

                if( similar.mid ) {
                    elmTitle.attr('href','?q=' + similar.title);
                    elmSimilarMovie.addClass('clickable');
                }

                elmSimilarMovie.append(elmTitle);

                elmSimilar.append(elmSimilarMovie);
            });

        }, 100+10*idx);

        var elm = $('<div>').addClass('movie clearfix').attr('mid',movie.id)
        .append(elmImage)
        .append(elmTitle)
        .append(elmScore)
        .append(elmGenre)
        .append(elmPlot)
        .append(elmSimilar)
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

function queryStringToJSON(qs) {
    qs = qs || location.search.slice(1);

    var pairs = qs.split('&');
    var result = {};
    pairs.forEach(function(pair) {
        var pair = pair.split('=');
        var key = pair[0];
        var value = decodeURIComponent(pair[1] || '');

        if( result[key] ) {
            if( Object.prototype.toString.call( result[key] ) === '[object Array]' ) {
                result[key].push( value );
            } else {
                result[key] = [ result[key], value ];
            }
        } else {
            result[key] = value;
        }
    });

    return JSON.parse(JSON.stringify(result));
};
