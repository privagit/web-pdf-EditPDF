let imageCounter = 0;
let savedSignatures = [];

//*---------------------------------------- Get PDF ----------------------------------------*
async function GetPDFShow(pdfData) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];

    try {
        const pdf = await pdfjsLib.getDocument({
            data: atob(pdfData.split(',')[1])
        }).promise;

        const pdfContainer = document.getElementById('pdf-container');
        pdfContainer.innerHTML = '';

        const imageTabs = document.getElementById('imageTabs');
        imageTabs.innerHTML = '';

        let pagePositions = []; // เก็บตำแหน่ง y ของแต่ละหน้า

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const scale = 3;
            const viewport = page.getViewport({ scale: scale });

            const div = document.createElement('div');
            div.id = `page-${pageNumber}`;
            div.className = 'pdf-page'; // เพิ่มคลาสสำหรับหน้า PDF
            div.style.display = 'block';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            canvas.style.width = (canvas.width / 3) + 'px'; // ลดขนาดการแสดงผลลงครึ่งหนึ่ง
            canvas.style.height = (canvas.height / 3) + 'px';

            const width = canvas.style.width
            $("#pdf-container").css("width", width)

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            const tab = document.createElement('div');
            tab.className = 'image-tab';
            tab.dataset.pageNumber = pageNumber; // เก็บหมายเลขหน้าใน dataset
            tab.style.width = '140px';
            tab.style.height = 'auto';
            tab.style.marginLeft = 'auto';
            tab.style.marginRight = 'auto';
            tab.style.border = '2px solid #d1d1d1';
            tab.style.cursor = 'pointer';
            tab.style.display = 'block';
            tab.addEventListener('click', function () {
                pdfContainer.scrollTop = pagePositions[pageNumber - 1];
                document.querySelectorAll('.image-tab').forEach(tab => tab.classList.remove('selected-tab'));
                this.classList.add('selected-tab');
            });

            const tabImage = document.createElement('img');
            tabImage.src = canvas.toDataURL();
            tabImage.alt = `Page ${pageNumber}`;
            tabImage.style.width = '100%';
            tab.appendChild(tabImage);

            const tabLabel = document.createElement('div');
            tabLabel.textContent = ` ${pageNumber}`;
            tabLabel.style.textAlign = 'center';
            // tabLabel.style.color='#19456B'
            // tabLabel.style.fontWeight="bold"
            tab.appendChild(tabLabel);

            imageTabs.appendChild(tab);

            div.appendChild(canvas);
            pdfContainer.appendChild(div);

            if (pageNumber === 1) {
                tab.classList.add('selected-tab');
            }

            const tabHeight = tab.offsetHeight;
            pagePositions.push(div.offsetTop - tabHeight);
        }

        pdfContainer.addEventListener('scroll', function () {
            for (let i = 0; i < pagePositions.length; i++) {
                let mapScroll = pdfContainer.scrollTop + 50;
                if (mapScroll >= pagePositions[i] && (i === pagePositions.length - 1 || mapScroll < pagePositions[i + 1])) {
                    document.querySelectorAll('.image-tab').forEach(tab => tab.classList.remove('selected-tab'));
                    const selectedTab = document.querySelector(`.image-tab[data-page-number="${i + 1}"]`);
                    if (selectedTab) {
                        selectedTab.classList.add('selected-tab');
                    }
                    break;
                }
            }
        });

    } catch (error) {
        console.error('Error loading PDF:', error);
    }
}

//*---------------------------------------- Setting Drag Move  ----------------------------------------*

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    preventDefaults(e);
    var dt = e.dataTransfer;
    var files = dt.files;
    const pdfData = sessionStorage.getItem('uploadedPDF');

    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    const pdfContainer = document.getElementById('pdf-container');
    const scrollPosition = pdfContainer.scrollTop + pdfContainer.clientHeight / 2; // Center of the viewport

    pdfjsLib.getDocument({ data: atob(pdfData.split(',')[1]) }).promise.then(pdf => {
        let pageNumber = 1; // Initialize pageNumber
        // Find the page number within the viewport
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const container = document.getElementById('page-' + pageNum);
            if (container) {
                if (scrollPosition >= container.offsetTop && scrollPosition <= container.offsetTop + container.clientHeight) {
                    pageNumber = pageNum; // Set pageNumber to the current page in view
                    break; // Exit the loop once found
                }
            }
        }

        // Call importImage with the determined pageNumber and pass event object
        handleFiles(files, pageNumber);
    });

    
}

function handleFiles(files, pageNumber) {
    if (files.length > 0) {
        var file = files[0];
        if (file.type.startsWith('image/')) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var img = new Image();
                img.onload = function() {
                    // กำหนดตำแหน่งและขนาดของรูปภาพที่ต้องการ
                    // Optionally, set the size and position of the image
                    img.style.position = 'absolute';
                    img.style.left = '0px'; // ตำแหน่ง x
                    img.style.top = '0px'; // ตำแหน่ง y
                    img.style.width = img.width / 2 + 'px'; // ความกว้างของรูปภาพ
                    img.style.height = img.height / 2 + 'px';// ความสูงของรูปภาพ

                    // Set a unique id for the img element
                    let imageId = `image-${Date.now()}`;
                    img.id = imageId;
                    img.className = 'resize-drag';
                    
                    imageCounter++; // Increment the counter for the next image
    
                    // Append the img element to the container holding the canvas of the specified page
                    let container = document.getElementById(`page-${pageNumber}`);
                        container.style.position = 'relative';
                        container.appendChild(img);

                    // เลือก container ที่ต้องการเพิ่มรูปภาพ


                    console.log('Image imported and added to PDF container via drag and drop');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}

function dragMoveListener(event) {
    var target = event.target
    // keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

    // translate the element
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

    // update the posiion attributes
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
}

//*---------------------------------------- Import Image ----------------------------------------*
function importImage(pageNumber, event) {
    let file = event.target.files[0] ? event.target.files[0] : null ; // Access file from event object
    
    try {
        if (file && file.type.startsWith('image/')) {
            let reader = new FileReader();
    
            reader.onload = function (e) {
                let img = new Image();
                img.onload = function () {
                    // Create an img element
                    // let newImg = document.createElement('img');
                    // newImg.src = e.target.result;
    
                    // Optionally, set the size and position of the image
                    // newImg.style.position = 'absolute';
                    // newImg.style.left = '0px';
                    // newImg.style.top = '0px';
                    // newImg.style.width = img.width / 2 + 'px';
                    // newImg.style.height = img.height / 2 + 'px';
    
                    // Set a unique id for the img element
                    // let imageId = `image-${Date.now()}`;
                    // newImg.id = imageId;
                    // newImg.className = 'resize-drag';

                    let wrapper = document.createElement('div');
                    wrapper.className = 'signature-wrapper';

                    // Create an img element for the saved image
                    let savedImg = document.createElement('img');
                    savedImg.src = e.target.result;
                    savedImg.draggable = true;

                    savedImg.ondragstart = function(event) {
                        event.dataTransfer.setData('text/plain', savedImg.src);
                    };

                    // Append the saved image to the wrapper and then to the saved signatures container
                    wrapper.appendChild(savedImg);
                    document.querySelector('.saved-signatures').appendChild(wrapper);

                    // Push the image data URL to savedSignatures
                    savedSignatures.push(e.target.result);

                    // Append the img element to the container holding the canvas of the specified page
                    // let container = document.getElementById(`page-${pageNumber}`);
                    //     container.style.position = 'relative';
                    //     container.appendChild(newImg);
                        

                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    } catch (error) {
        console.log('error :>> ', error);
    }
   
}

$(document).ready(function () {

    const {
        PDFDocument
    } = PDFLib

    let imageCounter = 0;
    
    const pdfData = sessionStorage.getItem('uploadedPDF');
    GetPDFShow(pdfData);
    

    let signaturePads = {};

    const modal = document.getElementById('myModal');
    const modalContent = document.getElementById('modalContent');

    //*---------------------------------------- Signature ----------------------------------------*
    //* Uploaded Signature
    $('#getUploadedSignature').on('click', function () {
        modal.classList.remove('hidden');
        // Allow for reflow
        modal.offsetWidth; // Trigger a reflow
        modal.classList.add('show');
        modalContent.classList.add('show');

        $('canvas.signature-pad').each(function() {
            let canvasId = $(this).attr('id');
            let canvas = document.getElementById(canvasId);
            let container = $(this).parent();

            canvas.width = container[0].clientWidth;
            canvas.height = container[0].clientHeight;
            signaturePads[canvasId] = new SignaturePad(canvas);
            
        });


    });

    //* Close Modal Signature
    $('#closeModalBtn').on('click', function () {
        modalContent.classList.remove('show');
        modal.classList.remove('show');
        setTimeout(() => {
          modal.classList.add('hidden');
        }, 300); // Match the transition durat
    });

    //* Clear Signature
    $('.btnClear').on('click', function () {
        let canvasId = $(this).data('canvas-id');
        let signaturePad = signaturePads[canvasId];
        console.log('canvasId :>> ', canvasId);

        if (signaturePad) {
            signaturePad.clear();
            console.log('Signature pad ' + canvasId + ' cleared.');
        }
    });

    //* Summit Signature
    $(".btnSummit").on('click', function () {
        let canvasId = $(this).data('canvas-id');
        let signaturePad = signaturePads[canvasId];

        if (signaturePad && !signaturePad.isEmpty()) {
            let signatureDataURL = signaturePad.toDataURL();

            let wrapper = document.createElement('div');
            wrapper.className = 'signature-wrapper';

            let img = document.createElement('img')
            img.src = signatureDataURL;
            img.draggable = true;

            img.ondragstart = function(event) {
                event.dataTransfer.setData('text/plain', img.src);
            };

            // savedSignatures.push(signatureDataURL);
            signaturePad.clear();
            modal.classList.remove('show');
            wrapper.appendChild(img);
            document.querySelector('.saved-signatures').appendChild(wrapper);

        }
    })

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            $('#closeModalBtn').click();
        }
      });

    //*---------------------------------------- Image ----------------------------------------*
    //*Click Add Image
    $("#getUploadedImage").on("click", function () {
        let fileInput = document.getElementById('import-image');
        fileInput.value = null;
    
        // Trigger the click event to open the file selection dialog again
        fileInput.click();
    })

    //* import ไฟล์ ภาพ
    $("#import-image").on("change", function (event) {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        const pdfContainer = document.getElementById('pdf-container');
        const scrollPosition = pdfContainer.scrollTop + pdfContainer.clientHeight / 2; // Center of the viewport
    
        pdfjsLib.getDocument({ data: atob(pdfData.split(',')[1]) }).promise.then(pdf => {
            let pageNumber = 1; // Initialize pageNumber
    
            // Find the page number within the viewport
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const container = document.getElementById('page-' + pageNum);
                if (container) {
                    if (scrollPosition >= container.offsetTop && scrollPosition <= container.offsetTop + container.clientHeight) {
                        pageNumber = pageNum; // Set pageNumber to the current page in view
                        break; // Exit the loop once found
                    }
                }
            }
    
            // Call importImage with the determined pageNumber and pass event object
            importImage(pageNumber, event);
        });
    });

    //*---------------------------------------- PDF ----------------------------------------*
    //* Download ไฟล์ PDF
    $('#download-pdf').on('click', async function () {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const divs = document.querySelectorAll('div[id^="page-"]');
        const fileName = sessionStorage.getItem('FileName');
        const canvases = [];
        
        // แสดง SweetAlert2 เริ่มต้น
         Swal.fire({
            title: "กำลังดาวน์โหลด PDF",
            timerProgressBar: true,
            html: "<div>กรุณารอสักครู่...<b>0%</b></div>",
            didOpen: () => {
                Swal.showLoading();
            },
        });
    
        // Convert divs to Canvas and store in array
        for (let i = 0; i < divs.length; i++) {
            const div = divs[i];
            const canvas = await html2canvas(div, {
                scale: 3,
            });
            canvases.push(canvas);
    
            // Update progress after each canvas is processed
            const progress = Math.round(((i + 1) / divs.length) * 100);
            Swal.getPopup().querySelector('b').textContent = `${progress}%`;
        }
    
        // Add Canvas to PDF
        for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const imgDataUrl = canvas.toDataURL('image/png', 1); // High quality
            const pageWidth = canvas.width;
            const pageHeight = canvas.height;
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
            const imgData = await fetch(imgDataUrl).then(res => res.arrayBuffer());
            const img = await pdfDoc.embedPng(imgData);
    
            // Draw image on PDF page
            page.drawImage(img, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight,
            });
    
            // // Update progress
            // const progress = Math.round(((i + 1) / canvases.length) * 100);
            // // Update SweetAlert2 with progress
            // Swal.getPopup().querySelector("b").textContent = `Progress: ${progress}%`;
        }
    
        // Save PDF and download
        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, fileName, "application/pdf");
    
        // Hide SweetAlert2 when done
        Swal.fire({
            title: 'ดาวน์โหลดสำเร็จ',
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
            sessionStorage.removeItem('uploadedPDF');
            sessionStorage.removeItem('FileName');
    
            window.location.href = 'http://localhost:5000/';
        });
    });
    
    
    //* Cancel ไฟล์ PDF
    $("#cancel-pdf").on("click", function () {
        sessionStorage.removeItem('uploadedPDF');
        sessionStorage.removeItem('FileName');

        window.location.href = 'http://localhost:5000/';
    })

    //*---------------------------------------- Setting Drag Move ----------------------------------------*
    var dropArea = document.getElementById('pdf-container');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    // เพิ่มอีเวนต์เพื่อเปลี่ยนรูปแบบเมื่อมีการลากไฟล์เข้ามาในพื้นที่ drop-area
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.backgroundColor = '#f0f0f0';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.style.backgroundColor = '';
        }, false);
    });

    // อีเวนต์สำหรับการปล่อยไฟล์ลงใน drop-area
    dropArea.addEventListener('drop', handleDrop, false);

    interact('.resize-drag')
        .resizable({
            // resize from all edges and corners
            edges: {
                left: true,
                right: true,
                bottom: true,
                top: true
            },

            listeners: {
                move(event) {
                    var target = event.target
                    var x = (parseFloat(target.getAttribute('data-x')) || 0)
                    var y = (parseFloat(target.getAttribute('data-y')) || 0)

                    // update the element's style
                    target.style.width = event.rect.width + 'px'
                    target.style.height = event.rect.height + 'px'

                    // translate when resizing from top or left edges
                    x += event.deltaRect.left
                    y += event.deltaRect.top

                    target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

                    target.setAttribute('data-x', x)
                    target.setAttribute('data-y', y)
                    target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)

                    target.classList.add('resizing')
                },
                end(event) {
                    // Hide border when resizing ends
                    event.target.classList.remove('resizing')
                }
              
            },
            modifiers: [
                // keep the edges inside the parent
                interact.modifiers.restrictEdges({
                    outer: 'parent'
                }),

                // minimum size
                interact.modifiers.restrictSize({
                    min: {
                        width: 100,
                        height: 50
                    }
                })
            ],

            inertia: true
        })
        .draggable({
            listeners: {
                move: window.dragMoveListener,
                // call this function on every dragend event
                end(event) {
                // Hide border when dragging ends
                event.target.classList.remove('dragging')
                // console.log("HelloWorldddd")
            },
            start(event) {
                // Show border when dragging starts
                event.target.classList.add('dragging')
            }
            },
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ]
        })


})