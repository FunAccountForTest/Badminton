document.addEventListener('DOMContentLoaded', function() {
    // Precision radio button tracking
    const radioButtons = {
        yes: document.querySelector('input[value="yes"]'),
        try: document.querySelector('input[value="try"]'),
        cant: document.querySelector('input[value="cant"]')
    };

    // Mouse position tracking
    let mouseX = 0;
    let mouseY = 0;
    let currentEmotion = null;

    // Thresholds with hysteresis
    const ACTIVATION_THRESHOLD = 50;
    const DEACTIVATION_THRESHOLD = 70;

    // Update mouse position
    function updateMousePosition(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    // Calculate precise distance to radio button center
    function calculateProximity(element) {
        if (!element) return Infinity;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.hypot(mouseX - centerX, mouseY - centerY);
    }

    // Emotion bubble management
    function updateEmoteBubble(emotion) {
        let bubble = document.getElementById('emote-bubble');
        if (!bubble) {
            bubble = document.createElement('div');
            bubble.id = 'emote-bubble';
            document.getElementById('slime-avatar').appendChild(bubble);
        }
        
        switch(emotion) {
            case 'happy': bubble.textContent = '😊'; break;
            case 'sad': bubble.textContent = '😟'; break;
            case 'angry': bubble.textContent = '😠'; break;
        }
    }

    function removeEmoteBubble() {
        const bubble = document.getElementById('emote-bubble');
        if (bubble) bubble.remove();
    }

    // Throttled emotion update
    function throttle(func, limit) {
        let inThrottle = false;
        return function() {
            if (!inThrottle) {
                func();
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function updateAvatarEmotion() {
        const avatar = document.getElementById('slime-avatar');
        if (!avatar) return;

        const yesDist = calculateProximity(radioButtons.yes);
        const tryDist = calculateProximity(radioButtons.try);
        const cantDist = calculateProximity(radioButtons.cant);
        
        const closestDistance = Math.min(yesDist, tryDist, cantDist);
        
        if (closestDistance < ACTIVATION_THRESHOLD) {
            let newEmotion = null;
            if (yesDist === closestDistance) newEmotion = 'happy';
            else if (tryDist === closestDistance) newEmotion = 'sad';
            else if (cantDist === closestDistance) newEmotion = 'angry';
            
            if (newEmotion !== currentEmotion) {
                avatar.classList.remove('happy', 'sad', 'angry');
                if (newEmotion) {
                    avatar.classList.add(newEmotion);
                    updateEmoteBubble(newEmotion);
                }
                currentEmotion = newEmotion;
            }
        }
        else if (closestDistance > DEACTIVATION_THRESHOLD && currentEmotion) {
            avatar.classList.remove('happy', 'sad', 'angry');
            removeEmoteBubble();
            currentEmotion = null;
        }
    }

    const throttledEmotionUpdate = throttle(updateAvatarEmotion, 100);

    // Event listeners
    window.addEventListener('mousemove', (e) => {
        updateMousePosition(e);
        throttledEmotionUpdate();
    });

    window.addEventListener('touchmove', (e) => {
        updateMousePosition(e.touches[0]);
        throttledEmotionUpdate();
    }, { passive: true });

    // Initialize
    updateAvatarEmotion();

    // Rotating benefits text
    const benefits = [
        "Escape the March heat in air-con sports hall 🧊",
        "Post-game lunch at nearby hawker centre! 🍜",
        "Free 100Plus provided – confirm more shiok than NS ration 🥤",
        "Chance to defeat your kakis and earn bragging rights 😎",
        "No need to book court yourself, already settled! 👍",
        "First time also can, got people teach one ⭐"
    ];

    let benefitIndex = 0;
    const benefitElement = document.getElementById('benefits');
    
    function rotateBenefits() {
        benefitElement.style.opacity = 0;
        
        setTimeout(() => {
            benefitElement.textContent = benefits[benefitIndex];
            benefitElement.style.opacity = 1;
            benefitIndex = (benefitIndex + 1) % benefits.length;
        }, 500);
    }
    
    setInterval(rotateBenefits, 4000);
    
    // Form submission handler
    const rsvpForm = document.getElementById('rsvpForm');
    const responsesContainer = document.getElementById('responsesContainer');
    
    rsvpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values for UI feedback
        const attendance = document.querySelector('input[name="attendance"]:checked').value;
        const friends = document.getElementById('friends').value;
        const message = document.getElementById('message').value;
        
        // Create FormData from the form element (includes all fields automatically)
        const formData = new FormData(rsvpForm);
        
        // Submit to Netlify
        fetch("/", {
            method: "POST",
            body: formData
        })
        .then(() => {
            // Create a response card
            addResponse(attendance, friends, message);
            
            // Reset form
            rsvpForm.reset();
            
            // Show success message
            showNotification('RSVP submitted successfully! Can see you there!');
        })
        .catch(error => console.error("Form submission error:", error));
    });
    
    // Dummy data for demonstration
    const dummyResponses = [
        {
            name: "Michael Tan",
            attendance: "yes",
            food: ["chicken-rice", "anything"],
            message: "I'll bring extra shuttlecocks!"
        },
        {
            name: "Siti Binte",
            attendance: "maybe",
            food: ["nasi-lemak"],
            message: "Might be slightly late, coming from East side."
        }
    ];
    
    // Initialize with dummy responses
    if (document.querySelector('.no-responses')) {
        responsesContainer.innerHTML = ''; // Clear "be the first" message
        dummyResponses.forEach(resp => {
            addResponse(resp.name, resp.attendance, resp.food, resp.message);
        });
    }
    
    // Function to add a response card
    function addResponse(name, attendance, food, message) {
        // Remove the "no responses" message if it exists
        const noResponsesMsg = document.querySelector('.no-responses');
        if (noResponsesMsg) {
            noResponsesMsg.remove();
        }
        
        // Create response card
        const responseCard = document.createElement('div');
        responseCard.className = 'response-card';
        
        // Status class
        let statusClass = '';
        let statusText = '';
        
        switch(attendance) {
            case 'yes':
                statusClass = 'status-yes';
                statusText = 'Can make it! ✅';
                break;
            case 'maybe':
                statusClass = 'status-maybe';
                statusText = 'Maybe can 🤔';
                break;
            case 'no':
                statusClass = 'status-no';
                statusText = 'Cannot lah 😢';
                break;
        }
        
        // Format food preferences
        let foodText = '';
        if (food && food.length > 0) {
            const foodNames = {
                'chicken-rice': 'Chicken Rice',
                'laksa': 'Laksa',
                'nasi-lemak': 'Nasi Lemak',
                'anything': 'Anything'
            };
            
            const foodLabels = food.map(f => foodNames[f] || f);
            foodText = `<div class="response-food">Food: ${foodLabels.join(', ')}</div>`;
        }
        
        // Format message if exists
        let messageHtml = '';
        if (message && message.trim() !== '') {
            messageHtml = `<div class="response-message">"${message}"</div>`;
        }
        
        // Construct the HTML
        responseCard.innerHTML = `
            <div class="response-name">${name}</div>
            <div class="response-status ${statusClass}">${statusText}</div>
            ${foodText}
            ${messageHtml}
        `;
        
        // Insert at the beginning
        responsesContainer.insertBefore(responseCard, responsesContainer.firstChild);
    }
    
    // Notification function
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
});

// Cursor-following avatar
const avatar = document.getElementById('avatar-container');
let mouseX = window.innerWidth/2;
let mouseY = window.innerHeight/2;
let currentX = mouseX;
let currentY = mouseY;

// Mouse movement handler
function handleMove(e) {
  mouseX = e.clientX || e.touches[0].clientX;
  mouseY = e.clientY || e.touches[0].clientY;
}

// Animation loop
function updateAvatar() {
  const dx = mouseX - currentX;
  const dy = mouseY - currentY;
  
  currentX += dx * 0.15;
  currentY += dy * 0.15;
  
  // Squish effect based on movement speed
  const speed = Math.sqrt(dx*dx + dy*dy);
  const squish = Math.min(1 + speed * 0.005, 1.2);
  const stretch = Math.max(1 - speed * 0.002, 0.9);
  
  avatar.style.transform = `
    translate(${currentX - 25}px, ${currentY - 12}px)
    rotate(${dx * 0.3}deg)
    scaleX(${stretch})
    scaleY(${squish})
  `;
  
  requestAnimationFrame(updateAvatar);
}

// Event listeners
window.addEventListener('mousemove', (e) => {
  handleMove(e);
  requestAnimationFrame(updateAvatarEmotion);
});
window.addEventListener('touchmove', (e) => {
  handleMove(e);
  requestAnimationFrame(updateAvatarEmotion);
}, { passive: true });
updateAvatar();

// Emotional Proximity System
const emotionalOptions = {
  yes: document.querySelector('label[for="yes"]'), // Label for "Yes, I'll be there"
  try: document.querySelector('label[for="try"]'), // Label for "I'll try my best"
  cant: document.querySelector('label[for="cant"]') // Label for "Can't this time"
};

function calculateProximity(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2 - 12; // Adjusted for new anchor point
  return Math.hypot(mouseX - centerX, mouseY - centerY); // Distance formula
}

function updateAvatarEmotion() {
  const yesDist = calculateProximity(emotionalOptions.yes);
  const tryDist = calculateProximity(emotionalOptions.try);
  const cantDist = calculateProximity(emotionalOptions.cant);
  const avatar = document.getElementById('slime-avatar');
  
  // Define proximity threshold (adjust as needed)
  const threshold = 100;

  if (yesDist < threshold || tryDist < threshold || cantDist < threshold) {
    avatar.classList.add('emotional');
    avatar.classList.toggle('happy', yesDist < threshold); // Happy for "Yes"
    avatar.classList.toggle('sad', tryDist < threshold); // Sad for "I'll try my best"
    avatar.classList.toggle('angry', cantDist < threshold); // Angry for "Can't this time"

    // Add emote bubble if not already present
    let bubble = document.getElementById('emote-bubble');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.id = 'emote-bubble';
      avatar.appendChild(bubble);
    }
    bubble.textContent = yesDist < threshold ? '😊' :
                        tryDist < threshold ? '😟' : '😠';
  } else {
    avatar.classList.remove('emotional', 'happy', 'sad', 'angry');
    const bubble = document.getElementById('emote-bubble');
    if (bubble) bubble.remove(); // Remove emote bubble when out of range
  }
}

// Add hover effect to interactive elements
document.querySelectorAll('button, input, textarea').forEach(el => {
  el.addEventListener('mouseenter', () => {
    avatar.style.transform += ' scale(1.2)';
  });
  el.addEventListener('mouseleave', () => {
    avatar.style.transform = avatar.style.transform.replace(' scale(1.2)', '');
  });
});

// Modify form submission handler for avatar feedback
const rsvpForm = document.getElementById('rsvpForm');
rsvpForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Add avatar animation
  avatar.style.animation = 'avatar-jump 0.5s';
  setTimeout(() => avatar.style.animation = '', 500);

  // Original form handling code
  const name = document.getElementById('name').value;
  // ... rest of your existing code ...
});
