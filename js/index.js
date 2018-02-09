$(document).ready(function(){
  if (!sessionStorage.getItem("quotes")){
    defineObjects();
  }

  if (!sessionStorage.getItem("lastResult")){
    $("#tweet").hide();
  } else {
    showTweetButton();
  }

  if (sessionStorage.getItem("currentQuote") && sessionStorage.getItem("answered")){
    $("#quote").html(sessionStorage.currentQuote);
    $("#result").html(sessionStorage.lastResult);
    $('label[for=answer1]').html(sessionStorage.currentOption1);  
    $("#answer1").val(sessionStorage.currentOption1);
    $('label[for=answer2]').html(sessionStorage.currentOption2);
    $("#answer2").val(sessionStorage.currentOption2);
    $('label[for=answer3]').html(sessionStorage.currentOption3);
    $("#answer3").val(sessionStorage.currentOption3);
  }
  
  $(".answer").click(checkAnswer);
});
function inIframe () { try { return window.self !== window.top; } catch (e) { return true; } }
var getQuotes = (function () {
  // ctor
  function self() { }

  // Ajax request method
  self.Request = function (params) {
    $.ajax({
      cache: params.cache || false,
      dataType: params.datatype || "json",
      type: params.verb || 'GET',
      data: params.data || {},
      async: params.async || true,
      processData: params.processData || true,
      url: params.url || "https://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=20",
      success: function (data, textStatus, xhr) {
        params.success(data);
      }
    });
  };
  // Return object
  return self;
})($);
function defineObjects(){
  //disable radio buttons
  $(".answer").attr('disabled', true);
  $("#quote").html("Waiting...");
  $("label[for=answer1]").html("Waiting...");
  $("label[for=answer2]").html("Waiting...");
  $("label[for=answer3]").html("Waiting...");
  
  quoteTable = getQuotes.Request({
    async: true,
    success: function (data) {
      //make quotes table
      var dataStringiified = JSON.stringify(data, ['title', 'content']);
      var dataDecoded = decodeHtmlEntity(dataStringiified);
      var quotes = JSON.parse(dataDecoded);
      
      //tweetproof quotes
      var i = 0;
      while(i < quotes.length){
        if(quotes[i].title.length > 24 || quotes[i].content.length + quotes[i].title.length > 130){
          quotes.splice(i,1);
        } else {
          quotes[i].content = quotes[i].content.replace(/<\/?[^>]+>|\n/gi, '').replace(/(^\s*)|(\s*$)/gi, '');
          i++;
        }
      }
      sessionStorage.setItem("quotes", JSON.stringify(quotes));
      
      //make authors set
      i = 0;
      var authorsStringified = JSON.stringify(data, ['title']);      
      var authors = JSON.parse(authorsStringified);
      
      //remove all authors 25+ characters in length
      while(i < authors.length){
        if(authors[i].title.length > 24){
          authors.splice(i,1);
        } else {
          i++;
        }
      }
      sessionStorage.setItem("authors", JSON.stringify(authors));
      
      //choose initial quote
      chooseQuote();
    }
  });
  //enable buttons
  $(".answer").attr('disabled', false);
}
function chooseQuote(){
  //get stored quotes
  var table = JSON.parse(sessionStorage.getItem("quotes"));
  
  //choose random index for quote
  var idx = Math.floor((Math.random() * table.length));
  
  //assign author, quote
  var quote = table[idx].content;
  var author = table[idx].title;
  
  sessionStorage.setItem("currentQuote", quote);
  sessionStorage.setItem("currentAuthor", author);
  sessionStorage.setItem("answered", false);
  
  //remove chosen quote from quotes and update session variable
  table.splice(idx, 1);
  sessionStorage.setItem("quotes", JSON.stringify(table));
  
  //show quote
  $("#quote").html(quote);
  
  //choose author options
  //get all authors
  var authors = JSON.parse(sessionStorage.getItem("authors"));
  
  //remove quote author
  for(var i = 0; i < authors.length; i++){
    if(authors[i].title == author){
      authors.splice(i, 1);
    }
  }
  
  //pick random incorrect author
  idx = Math.floor((Math.random() * authors.length));
  var pick1 = authors.splice(idx, 1);
  pick1 = pick1[0].title;
  
  //pick another random incorrect author
  idx = Math.floor((Math.random() * authors.length));
  var pick2 = authors.splice(idx, 1);
  pick2 = pick2[0].title;
  
  //assign authors to random option buttons
  var authorOptions = [author, pick1, pick2];
  var buttonOptions = [1,2,3];
  var idx1;
  var idx2;

  for(var i = 0; i < 3; i++){
    idx1 = Math.floor((Math.random() * buttonOptions.length));
    idx2 = Math.floor((Math.random() * authorOptions.length));
    $('label[for=answer' + buttonOptions[idx1] + ']').html(authorOptions[idx2]);
    $("#answer" + buttonOptions[idx1]).val(authorOptions[idx2]);
    sessionStorage.setItem("currentOption" + buttonOptions[idx1], authorOptions[idx2]);
    buttonOptions.splice(idx1, 1);
    authorOptions.splice(idx2, 1);
  }
}
function checkAnswer(){
  sessionStorage.setItem("answered", true);
  var result = "";
  
  //check if answer correct
  if(this.value == sessionStorage.currentAuthor){
    result = "<b>CORRECT:</b><br><br>";
  } else {
    result = "<b>INCORRECT:</b><br><br>";
  }
  
  //display result
  var quoteWAuthor = sessionStorage.currentQuote + " -" + sessionStorage.currentAuthor;
  sessionStorage.setItem("quoteWAuthor", quoteWAuthor);
  
  showTweetButton();
  
  result += quoteWAuthor;
  sessionStorage.setItem("lastResult", result);
  $("#result").html(result);
  
  var quotes = JSON.parse(sessionStorage.getItem("quotes"));

  if(quotes.length != 0){
    chooseQuote();
  } else {
    defineObjects();
  }
  
  //clear selection
  $(".answer").prop("checked", false);
}
function showTweetButton(){
  $("#tweet").show();
  if(inIframe()){
    $('#tweet-quote').attr("href", "https://twitter.com/intent/tweet?hashtags=quotes&text=" + encodeURIComponent(sessionStorage.quoteWAuthor));
  }
}
function decodeHtmlEntity(str) {
  return str.replace(/&#(\d+);/g, function(match, dec) {
    return String.fromCharCode(dec);
  });
};