
        // DOM Elements
        const video = document.getElementById('video');
        const overlay = document.getElementById('overlay');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const snapshotBtn = document.getElementById('snapshotBtn');
        const statusDiv = document.getElementById('status');
        const currentEmotionDiv = document.getElementById('currentEmotion');
        const detailedResultsDiv = document.getElementById('detailedResults');
        const expressionsList = document.getElementById('expressionsList');
        const historyList = document.getElementById('historyList');
        
        // Variables
        let isDetecting = false;
        let detectionInterval;
        let modelsLoaded = false;
        const detectionHistory = [];
        
        // Load models
        async function loadModels() {
            try {
                statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading AI models...';
                statusDiv.className = 'bg-blue-50 text-blue-800 px-4 py-3 rounded-lg';
                
                await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
                await faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
                
                modelsLoaded = true;
                statusDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Models loaded successfully';
                statusDiv.className = 'bg-green-50 text-green-800 px-4 py-3 rounded-lg';
                
                startBtn.disabled = false;
            } catch (error) {
                console.error('Error loading models:', error);
                statusDiv.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Failed to load models';
                statusDiv.className = 'bg-red-50 text-red-800 px-4 py-3 rounded-lg';
            }
        }
        
        // Start webcam and detection
        async function startDetection() {
            if (!modelsLoaded) {
                alert('Please wait for models to load');
                return;
            }
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480, facingMode: "user" }, 
                    audio: false 
                });
                video.srcObject = stream;
                
                video.onloadedmetadata = () => {
                    video.play();
                    overlay.width = video.videoWidth;
                    overlay.height = video.videoHeight;
                    
                    isDetecting = true;
                    statusDiv.innerHTML = '<i class="fas fa-redo-alt fa-spin mr-2"></i> Detecting facial expressions';
                    statusDiv.className = 'bg-blue-50 text-blue-800 px-4 py-3 rounded-lg';
                    
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                    snapshotBtn.disabled = false;
                    
                    // Start detection loop
                    detectionInterval = setInterval(detectExpressions, 300);
                };
            } catch (error) {
                console.error('Error accessing webcam:', error);
                statusDiv.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Webcam access denied';
                statusDiv.className = 'bg-red-50 text-red-800 px-4 py-3 rounded-lg';
            }
        }
        
        // Stop detection
        function stopDetection() {
            if (!isDetecting) return;
            
            clearInterval(detectionInterval);
            isDetecting = false;
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            
            tracks.forEach(track => track.stop());
            video.srcObject = null;
            
            statusDiv.innerHTML = '<i class="fas fa-info-circle mr-2"></i> Detection stopped';
            statusDiv.className = 'bg-gray-100 text-gray-800 px-4 py-3 rounded-lg';
            
            startBtn.disabled = false;
            stopBtn.disabled = true;
            snapshotBtn.disabled = true;
        }
        
        // Detect facial expressions
        async function detectExpressions() {
            if (!isDetecting) return;
            
            try {
                const detections = await faceapi.detectAllFaces(
                    video, 
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks().withFaceExpressions();
                
                const canvas = document.getElementById('overlay');
                const context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw detections and landmarks
                faceapi.draw.drawDetections(canvas, detections);
                faceapi.draw.drawFaceLandmarks(canvas, detections);
                
                if (detections && detections.length > 0) {
                    const expressions = detections[0].expressions;
                    
                    // Get dominant expression
                    let dominantExpression = '';
                    let maxProbability = 0;
                    
                    for (const expression in expressions) {
                        if (expressions[expression] > maxProbability) {
                            maxProbability = expressions[expression];
                            dominantExpression = expression;
                        }
                    }
                    
                    // Update current emotion display
                    updateCurrentEmotion(dominantExpression, maxProbability);
                    
                    // Update detailed expressions
                    updateDetailedExpressions(expressions);
                    
                    // Add to history if changed significantly
                    if (detectionHistory.length === 0 || 
                        detectionHistory[detectionHistory.length - 1].emotion !== dominantExpression) {
                        
                        const timestamp = new Date().toLocaleTimeString();
                        detectionHistory.push({
                            emotion: dominantExpression,
                            probability: maxProbability.toFixed(2),
                            time: timestamp
                        });
                        
                        updateHistory();
                    }
                } else {
                    currentEmotionDiv.innerHTML = `
                        <div class="inline-block mb-4">
                            <span class="text-gray-500 text-5xl"><i class="far fa-user"></i></span>
                        </div>
                        <h3 class="text-xl font-medium text-gray-700">No face detected</h3>
                        <p class="text-gray-500">Please position your face in the frame</p>
                    `;
                    detailedResultsDiv.classList.add('hidden');
                }
            } catch (error) {
                console.error('Error detecting expressions:', error);
            }
        }
        
        // Update current emotion display
        function updateCurrentEmotion(emotion, probability) {
            const emotionIcons = {
                'happy': 'fa-smile-beam',
                'sad': 'fa-sad-tear',
                'angry': 'fa-angry',
                'fearful': 'fa-flushed',
                'disgusted': 'fa-grimace',
                'surprised': 'fa-surprise',
                'neutral': 'fa-meh'
            };
            
            const emotionColors = {
                'happy': 'text-yellow-400',
                'sad': 'text-blue-400',
                'angry': 'text-red-400',
                'fearful': 'text-purple-400',
                'disgusted': 'text-green-400',
                'surprised': 'text-orange-400',
                'neutral': 'text-gray-400'
            };
            
            const emotionNames = {
                'happy': 'Happy 😊',
                'sad': 'Sad 😢',
                'angry': 'Angry 😠',
                'fearful': 'Fearful 😨',
                'disgusted': 'Disgusted 🤢',
                'surprised': 'Surprised 😲',
                'neutral': 'Neutral 😐'
            };
            
            currentEmotionDiv.innerHTML = `
                <div class="inline-block mb-4">
                    <span class="${emotionColors[emotion]} text-5xl"><i class="far ${emotionIcons[emotion]}"></i></span>
                </div>
                <h3 class="text-xl font-medium text-gray-700">${emotionNames[emotion]}</h3>
                <p class="text-gray-500">Confidence: ${(probability * 100).toFixed(1)}%</p>
            `;
            
            detailedResultsDiv.classList.remove('hidden');
        }
        
        // Update detailed expressions view
        function updateDetailedExpressions(expressions) {
            expressionsList.innerHTML = '';
            
            for (const [expression, probability] of Object.entries(expressions)) {
                const expressionItem = document.createElement('div');
                expressionItem.className = 'mb-2';
                
                const expressionName = document.createElement('div');
                expressionName.className = 'flex justify-between mb-1 text-sm font-medium text-gray-700';
                
                // Capitalize first letter
                const formattedName = expression.charAt(0).toUpperCase() + expression.slice(1);
                expressionName.innerHTML = `
                    <span>${formattedName}</span>
                    <span>${(probability * 100).toFixed(1)}%</span>
                `;
                
                const progressBar = document.createElement('div');
                progressBar.className = 'w-full bg-gray-200 rounded-full h-2 overflow-hidden';
                
                const progressBarFill = document.createElement('div');
                progressBarFill.className = 'expression-progress bg-teal-500 rounded-full h-2';
                progressBarFill.style.width = `${probability * 100}%`;
                
                progressBar.appendChild(progressBarFill);
                
                expressionItem.appendChild(expressionName);
                expressionItem.appendChild(progressBar);
                
                expressionsList.appendChild(expressionItem);
            }
        }
        
        // Update detection history
        function updateHistory() {
            if (detectionHistory.length === 0) {
                historyList.innerHTML = '<p class="text-gray-500 italic text-center py-4">Your detection history will appear here</p>';
                return;
            }
            
            historyList.innerHTML = '';
            
            // Show only last 10 items in reverse order
            const recentHistory = detectionHistory.slice(Math.max(detectionHistory.length - 10, 0)).reverse();
            
            recentHistory.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg';
                
                const emotionIcons = {
                    'happy': 'fa-smile-beam',
                    'sad': 'fa-sad-tear',
                    'angry': 'fa-angry',
                    'fearful': 'fa-flushed',
                    'disgusted': 'fa-grimace',
                    'surprised': 'fa-surprise',
                    'neutral': 'fa-meh'
                };
                
                const emotionColors = {
                    'happy': 'bg-yellow-100 text-yellow-600',
                    'sad': 'bg-blue-100 text-blue-600',
                    'angry': 'bg-red-100 text-red-600',
                    'fearful': 'bg-purple-100 text-purple-600',
                    'disgusted': 'bg-green-100 text-green-600',
                    'surprised': 'bg-orange-100 text-orange-600',
                    'neutral': 'bg-gray-100 text-gray-600'
                };
                
                const emotionNames = {
                    'happy': 'Happy',
                    'sad': 'Sad',
                    'angry': 'Angry',
                    'fearful': 'Fearful',
                    'disgusted': 'Disgusted',
                    'surprised': 'Surprised',
                    'neutral': 'Neutral'
                };
                
                historyItem.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${emotionColors[item.emotion]} flex items-center justify-center">
                            <i class="fas ${emotionIcons[item.emotion]} text-xs"></i>
                        </div>
                        <div>
                            <p class="font-medium">${emotionNames[item.emotion]}</p>
                            <p class="text-xs text-gray-500">${item.time}</p>
                        </div>
                    </div>
                    <span class="text-sm font-medium">${(item.probability * 100).toFixed(0)}%</span>
                `;
                
                historyList.appendChild(historyItem);
            });
        }
        
        // Take snapshot
        async function takeSnapshot() {
            if (!isDetecting) {
                alert('Please start detection first');
                return;
            }
            
            try {
                // Create canvas to draw the current frame
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Get detections for the snapshot
                const detections = await faceapi.detectAllFaces(
                    video, 
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceLandmarks().withFaceExpressions();
                
                // Draw detections on the canvas
                faceapi.draw.drawDetections(canvas, detections);
                faceapi.draw.drawFaceLandmarks(canvas, detections);
                faceapi.draw.drawFaceExpressions(canvas, detections);
                
                // Get data URL and create a download link
                const dataURL = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `mood-mirror-${new Date().toISOString().slice(0, 10)}.png`;
                link.href = dataURL;
                
                // Trigger the download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Show success message
                const originalStatus = statusDiv.innerHTML;
                const originalClass = statusDiv.className;
                
                statusDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Snapshot saved!';
                statusDiv.className = 'bg-green-50 text-green-800 px-4 py-3 rounded-lg';
                
                setTimeout(() => {
                    statusDiv.innerHTML = originalStatus;
                    statusDiv.className = originalClass;
                }, 3000);
            } catch (error) {
                console.error('Error taking snapshot:', error);
                statusDiv.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Failed to take snapshot';
                statusDiv.className = 'bg-red-50 text-red-800 px-4 py-3 rounded-lg';
            }
        }
        
        // Event Listeners
        startBtn.addEventListener('click', startDetection);
        stopBtn.addEventListener('click', stopDetection);
        snapshotBtn.addEventListener('click', takeSnapshot);
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadModels();
            startBtn.disabled = true;
            stopBtn.disabled = true;
            snapshotBtn.disabled = true;
        });
    