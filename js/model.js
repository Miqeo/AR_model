var canvasRef, scene, camera, renderer, clock, deltaTime, totalTime;

var scale = 1.0;

var arToolkitSource, arToolkitContext;

var markerRoot1;

var mesh1;

var modelUrl, textureUrl;

window.addEventListener('load', function() {
	document.querySelector('input[id="model"]').addEventListener('change', function() {
		if (this.files && this.files[0]) {
			modelUrl = URL.createObjectURL(this.files[0]);
		}
	});
    document.querySelector('input[id="texture"]').addEventListener('change', function() {
		if (this.files && this.files[0]) {
			textureUrl = URL.createObjectURL(this.files[0]);
		}
	});
	document.querySelector('input[id="scale"]').addEventListener('change', function() {
		scale = this.value;
	});
});

function initialization(mockup)
{

    if (mockup)
    {
        modelUrl = "models/valve-Assembly.obj";
        textureUrl = "models/valve-Assembly.mtl";
		scale = 0.01;
    }

    if (!modelUrl || !textureUrl || !scale) 
    {
        return;
    }
    document.getElementById('popup').style.display = 'none';

	scene = new THREE.Scene();

	let ambientLight = new THREE.AmbientLight( 0xcccccc, 0.8 );
	scene.add( ambientLight );

	const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
	directionalLight.position.set(10, 20, 10);
	directionalLight.castShadow = true;
	scene.add( directionalLight );
				
	camera = new THREE.Camera();
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({
		antialias : true,
		alpha: true,
		logarithmmicDepthBuffer: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( screen.width, screen.height );
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;
	
	////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
        displayWidth: screen.width,
        displayHeight: screen.height,
	});


	function onResize()
	{
		arToolkitSource.onResize()	
		arToolkitSource.copySizeTo(renderer.domElement)	
		if ( arToolkitContext.arController !== null )
		{
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)
		}	
	}

	arToolkitSource.init(function onReady(){
		onResize()
	});
	
	// handle resize event
	window.addEventListener('resize', function(){
		onResize()
	});
	
	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////	

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	arToolkitContext.init( function onCompleted(){

		if (arToolkitContext.arController) {
			arToolkitContext.arController.setProjectionNearPlane(10);
			arToolkitContext.arController.setProjectionFarPlane(11); 

			camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
		}
	});

	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////

	// build markerControls
	markerRoot1 = new THREE.Group();
	scene.add(markerRoot1);
	let markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {
		type: 'pattern', patternUrl: "data/hiro.patt",
	})
	
	function onProgress(xhr) { console.log( (xhr.loaded / xhr.total * 100) + '% loaded' ); }
	function onError(xhr) { console.log( 'An error happened' ); }
	
	new THREE.MTLLoader()
		.load( textureUrl, function ( materials ) {
			materials.preload();
			new THREE.OBJLoader()
				.setMaterials( materials )
				.load( modelUrl, function ( group ) {

					group.traverse(function (child) {
						if (child instanceof THREE.Mesh) {
							child.material.side = THREE.FrontSide;
							child.castShadow = true;
							child.receiveShadow = true;

							child.material.polygonOffset = true;
							child.material.polygonOffsetFactor = 2; 
							child.material.polygonOffsetUnits = 2;
						}
					});

					// group.position.y = 1;
					group.rotateX(-Math.PI/2)
					group.scale.set(scale,scale,scale);
					markerRoot1.add(group);
					
				}, onProgress, onError );
		});


	animate();
}


function update()
{
	// update artoolkit on every frame
	if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );
}


function render()
{
	renderer.render( scene, camera );
}


function animate()
{
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	render();
}