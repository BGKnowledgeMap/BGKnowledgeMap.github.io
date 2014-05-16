var groupList = [
      "TITOLO",
      "MACROAREA",
      "PROMOTORE PROGETTO",
      "COMMITTENTE/FINANZIATORE",
      "PARTNERS"
    ];

$.getJSON("/data/knowledgeMapLists.json", function(data) {
  //split lists
  _.each(data, function(d) {
    _.each(groupList, function(group) {
      d[group] = $.map(d[group].split(","), $.trim);
    });
  })

  var macroaree = [];
  _.each(_.pluck(data, "MACROAREA"), function(d) {
    macroaree = _.union(macroaree, d);
  })

  var promotori = [];
  _.each(_.pluck(data, "PROMOTORE PROGETTO"), function(d) {
    promotori = _.union(promotori, d);
  })

  var partners = [];
  _.each(_.pluck(data, "PARTNRES"), function(d) {
    partners = _.union(partners, d);
  })

  var finanziatori = [];
  _.each(_.pluck(data, "COMMITTENTE/FINANZIATORE"), function(d) {
    finanziatori = _.union(finanziatori, d);
  })

  var macroareeResults = {};
  var sum = 0;
  var promotoriResults = {};
  var collaborazioniResults = {};
  var finanziatoriResults = {};
  
  _.each(data, function(d) {
    sum = data.length;

    _.each(macroaree, function(group) {
      if(_.contains(d["MACROAREA"], group)) {
        macroareeResults[group] = macroareeResults[group] ? macroareeResults[group]+1 : 1;
      }
    });

    _.each(promotori, function(group) {
      if(_.contains(d["PROMOTORE PROGETTO"], group)) {
        promotoriResults[group] = promotoriResults[group] ? promotoriResults[group]+1 : 1;
      }
    });

    _.each(_.uniq(_.union(promotori, partners)), function(group) {
      if(_.contains(d["PROMOTORE PROGETTO"], group) || _.contains(d["PARTNERS"], group)) {
        var sum = d["PARTNERS"].length;
        collaborazioniResults[group] = collaborazioniResults[group] ? collaborazioniResults[group] + sum : sum;
      }
    });

    _.each(finanziatori, function(group) {
      if(_.contains(d["COMMITTENTE/FINANZIATORE"], group)) {
        finanziatoriResults[group] = finanziatoriResults[group] ? finanziatoriResults[group]+1 : 1;
      }
    });

    //collaborazioniResults[d["TITOLO"]] = d["PARTNERS"].length;
  });

  _.each(_.pairs(macroareeResults), function(e) {
    var tr = $('<tr></tr>');
    tr.append($('<td></td>').text(e[0])).append($('<td></td>').text(e[1]));
    $('#statistics1').append(tr);
  });

  $("#statistics1").append($('<tr></tr>').append($('<td></td>').text("TOTALE")).append($('<td></td>').text(sum)));

  var sorted = _.last(_.sortBy(_.pairs(promotoriResults), function(e) {
    return e[1];
  }), 10);
  
  _.each(sorted, function(e) {
    var tr = $('<tr></tr>');
    tr.append($('<td></td>').text(e[0])).append($('<td></td>').text(e[1]));
    $('#statistics2').prepend(tr);
  });

  var sorted = _.last(_.sortBy(_.pairs(collaborazioniResults), function(e) {
    return e[1];
  }), 10);

  _.each(sorted, function(e) {
    var tr = $('<tr></tr>');
    tr.append($('<td></td>').text(e[0])).append($('<td></td>').text(e[1]));
    $('#statistics3').prepend(tr);
  });

  var sorted = _.last(_.sortBy(_.pairs(finanziatoriResults), function(e) {
    return e[1];
  }), 10);

  _.each(sorted, function(e) {
    var tr = $('<tr></tr>');
    tr.append($('<td></td>').text(e[0])).append($('<td></td>').text(e[1]));
    $('#statistics4').prepend(tr);
  });

});
