const searchBtn = document.querySelector('.search-btn');
const titleResult = document.querySelector('.title-result');
const coverResult = document.querySelector('.cover-result');
const waitingInfoH3 = document.querySelector('.waiting-info-h3');
const authorInpt = document.querySelector('.author-inpt');
const titleInpt = document.querySelector('.title-inpt');

searchBtn.addEventListener('keydown', async (e) => {
    e.preventDefault();
    if (e.keyCode === 13) search();
});

searchBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    search();
});

const search = (e) => {
    const author = authorInpt.value;
    const title = titleInpt.value;

    if (!author || !title) {
        titleResult.innerHTML = "Do not leave any empty fields";
    } else {
        searchBtn.disabled = true;
        waitingInfoH3.style.display = 'block';
        waitingInfoH3.style.opacity = '1';

        fetch('/searching', {
            method:'POST',
            mode: 'cors', // no-cors, *cors, same-origin
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ author: author, title: title })
        })
        .then(response => response.json())
        .then(data => {
            waitingInfoH3.style.opacity = '0';
            waitingInfoH3.style.display = 'none';
            searchBtn.disabled = false;

            titleResult.innerHTML = data.result;
            if (data.cover && data.albumURL) {
                coverResult.innerHTML = `<a href="${data.albumURL}" class="album-url" target="_blank"><img src="${data.cover}"></a>`;
            }
        }).catch(err => console.log(err))
    }
}