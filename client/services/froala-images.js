angular.module('bubliq').factory('froalaImages', function() {

  var froalaImages = this;

  froalaImages.froalaOptions = (placeholder, buttons) => {
    var options = {
      inlineMode: false,
      placeholderText: placeholder || '',
      toolbarSticky: false
    };

    if (buttons) {
      options.toolbarButtons = buttons;
      options.toolbarButtonsMD = buttons;
      options.toolbarButtonsSM = buttons;
      options.toolbarButtonsXS = buttons;
    } else {
      options.toolbarButtons = ['fullscreen', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', '|',
                               'color', 'emoticons', 'inlineStyle', 'paragraphStyle', '|',
                               'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', 'insertHR', '-',
                               'undo', 'redo', 'clearFormatting', 'selectAll', 'html', 'insertLink', 'insertImage', 'insertVideo', 'insertFile', 'insertTable' ]
    }

    return options;
  }


  return froalaImages;
})
