
oform.on('click', '.oforms-inline-guidance-view', function(evt) {
    evt.preventDefault();
    $('.oforms-inline-guidance', $(this).parents('.controls').first()).toggle();
});
