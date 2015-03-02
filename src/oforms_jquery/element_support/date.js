
var MONTH_NAMES_DISP = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sept','Oct','Nov','Dec'];
var MONTH_NAMES_ABBR = ['ja','f','mar','ap','may','jun','jul','au','s','o','n','d'];

var forgivingDateParse = function(str, asComponentArray) {
    var elements = trimWhitespace(str).split(/\W+/);
    if(elements.length != 3) {return;}
    var day = parseInt(elements[0], 10);
    var year = parseInt(elements[2], 10);
    if(!day || !year) {return;}
    var month = parseInt(elements[1], 10);
    if(month === 0 || isNaN(month)) {
        // Attempt text parsing
        for(var i = 0; i < MONTH_NAMES_ABBR.length; ++i) {
            var abbr = MONTH_NAMES_ABBR[i];
            if(elements[1].toLowerCase().substring(0,abbr.length) === abbr) {
                month = i + 1;
                break;
            }
        }
    }
    if(!month) {return;}
    var internalDate = padZeros(year,4)+'-'+padZeros(month,2)+'-'+padZeros(day,2);
    var isValidDate;
    // Attempt check the date is actually valid
    var testYear = 2000+(year % 1000);  // Work within supported range of dates
    try {
        var d = new Date(testYear, month - 1, day);
        if(d && (d.getFullYear() === testYear) && (d.getMonth() === (month - 1)) && (d.getDate() === day)) {
            isValidDate = true;
        }
    } catch(e) {
        // if there's an exception, isValidDate won't be set to true
    }
    return isValidDate ? (asComponentArray ? [year,month,day] : internalDate) : undefined;
};

var validatingDateFieldCopyIntoHidden = function(userInput) {
    var hidden = $('input[type=hidden]', $(userInput).parent());
    var date = forgivingDateParse(userInput.value);
    hidden.val(date || (userInput.value ? 'invalid' : '')); // if blank, hidden element is blank too
    return date;
};

var setDateFieldFromComponents = function(userInput, dateComponents) {
    var hidden = $('input[type=hidden]', $(userInput).parent());
    var yyyy = padZeros(dateComponents[0],4);
    var dd = padZeros(dateComponents[2],2);
    hidden.val(yyyy+'-'+padZeros(dateComponents[1],2)+'-'+dd);
    userInput.value = dd+' '+MONTH_NAMES_DISP[dateComponents[1]]+' '+yyyy;
    userInput.focus();
};

// --------------------------------------------------------------------------------------------------------

// Calendar pop up
var calendarPopup = (function() {
    var popup;
    var currentClickFn;
    var currentMonth;
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    var makePopupContents = function(dateComponents) {
        var d, year, month, day;
        if(dateComponents) {
            year = dateComponents[0]; month = dateComponents[1]; day = dateComponents[2];
        } else {
            d = new Date();
            year = d.getFullYear(); month = d.getMonth()+1; // but not the day, so it's not selected
        }
        // Year and month always set.
        currentMonth = [year, month];
        // Day is set if there's a selected day.
        var yearStr = ''+year;
        while(yearStr.length < 4) { yearStr = '0' + yearStr; }
        var html = [
            '<a href="#" class="oforms-calendar-popup-month-move">&#9668;</a><span class="oforms-calendar-popup-monthyear">',
            monthNames[month - 1], ' ', yearStr,
            '</span><a href="#" class="oforms-calendar-popup-month-move">&#9658;</a>',
            '<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>'
        ];
        // Generate the days... remember year is a larger range than JS can handle, so use a modulus of it
        d = new Date(2000+(year % 1000), month - 1, 1);
        // Output spans for the unused days
        for(var l = 0; l < d.getDay(); ++l) {
            html.push('<span>&nbsp;</span>');
        }
        // Output links for the used days
        while(d.getMonth() === (month - 1)) {
            var dd = d.getDate();
            if(dd === day) {
                html.push('<span class="oforms-calendar-popup-selected">', dd, '</span>');
            } else {
                html.push('<a href="#" data-date="', year, ' ', month, ' ', dd, '">', dd, '</a>');
            }
            d.setDate(dd+1);    // next day, will wrap to next month
        }
        return html.join('');
    };

    // Public interface
    return {
        _display: function(input, dateComponents, clickFn) {
            if(!popup) {
                // Create popup
                popup = document.createElement('div');
                popup.id = 'oforms-calendar-popup';
                document.body.appendChild(popup);
                $(popup).
                    on('click mousedown', function(evt) { evt.preventDefault(); }).  // stop focus changing on clicks, etc
                    on('mousedown', 'a', function(evt) {
                        var date = this.getAttribute('data-date');
                        if(date) {
                            // One of the date numbers has been clicked
                            var components = _.map(date.split(' '), function(x) { return parseInt(x, 10); });
                            if(currentClickFn) {
                                currentClickFn(components);
                            }
                            popup.innerHTML = makePopupContents(components);
                        } else if(this.className === 'oforms-calendar-popup-month-move') {
                            // Back or forward on the months
                            var dir = (this.previousSibling) ? 1 : -1;  // back is first node in popup
                            var y = currentMonth[0], m = currentMonth[1] + dir;
                            if(m < 1) {
                                m = 12;
                                y--;
                            } else if(m > 12) {
                                m = 1;
                                y++;
                            }
                            popup.innerHTML = makePopupContents([y, m]);
                        }
                    });
            }
            popup.innerHTML = makePopupContents(dateComponents);
            // Position and show
            positionClone(popup, input, input.offsetWidth - 64, -192);
            $(popup).show();
            // Store callback
            currentClickFn = clickFn;
        },
        _blur: function() {
            if(popup) {
                $(popup).hide();
            }
            currentClickFn = undefined;
        }
    };

})();

// --------------------------------------------------------------------------------------------------------

oform.on({
    'keyup': function() { validatingDateFieldCopyIntoHidden(this); },
    'focus': function() {
        var userInput = this;
        // When element get the focus, remove the error marker, as it's distracting
        $(userInput).removeClass('oforms-invalid-date');
        calendarPopup._display(userInput, forgivingDateParse(userInput.value, true), function(dateComponents) {
            setDateFieldFromComponents(userInput, dateComponents);
        });
    },
    'blur': function() {
        // When element loses the focus, display an error marker on the field
        if(validatingDateFieldCopyIntoHidden(this)) {
            $(this).removeClass('oforms-invalid-date');
        } else {
            if(this.value) {
                $(this).addClass('oforms-invalid-date');
            }
        }
        calendarPopup._blur();
    }
}, '.oforms-date-input');
