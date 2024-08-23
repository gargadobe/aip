export default async function decorate(block) {
  const links = [...block.querySelectorAll('a')].map((a) => a.href);
  const elementsLink = links.find((link) => link.startsWith(window.location.origin) && link.endsWith('.json'));
  const response = await fetch(elementsLink);
  const resJson = await response.json();
  const elements = resJson.data;
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'cards-container';
  elements.forEach((item) => {
    const { title, description, imageUrl, tags } = item;
    const card = document.createElement('div');
    card.className = 'card';
    const cardTitle = document.createElement('h3');
    cardTitle.className = 'card-title';
    cardTitle.textContent = title;
    
    // Render description as HTML
    const cardDescription = document.createElement('div');
    cardDescription.className = 'card-description';
    cardDescription.innerHTML = description;
    
    const cardImage = document.createElement('img');
    cardImage.className = 'card-image';
    cardImage.src = imageUrl || 'https://culture-tecture.adobe.com/en/publish/2024/06/18/media_193f46a1d6e96b66d3484d186062548bbe41f3908.png?width=2000&format=webply&optimize=medium'; // Set default image URL if imageUrl is not found
    cardImage.alt = title;
    
    // Create tags element
    const cardTags = document.createElement('div');
    cardTags.className = 'card-tags';
    const tagsArr = tags.split(',') || [];
    if (tagsArr && tagsArr.length > 0) {
      tagsArr.forEach(tag => {
        const tagElement = document.createElement('a');
        tagElement.className = 'tag';
        tagElement.href = `#${tag.trim()}`;
        tagElement.textContent = tag;
        cardTags.append(tagElement);
      });
    }

    card.append(cardTitle, cardDescription, cardImage, cardTags);
    cardsContainer.append(card);
  });
  block.replaceChildren(cardsContainer);
}