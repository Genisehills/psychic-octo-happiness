var coachmarkMap = new Object();	// 'id' is the key
var totalcards;
var strings;
var firstLaunch = true;
 
function loadStrings() {
	var stringJson = JSON.stringify(stringmap);
	stringJson = window.require('uxp').AnOnboarding.getLocalizedStrings(stringJson);
	strings = JSON.parse(stringJson);
	for (var key in strings) {
	    // skip loop if the property is from prototype
	    if (!strings.hasOwnProperty(key)) continue;

	    let element = document.getElementById(key.toString());
	    if (typeof(element) != 'undefined' && element != null) {
			element.innerHTML = strings[key].toString();
		}
	}

	// updating the title of the dialog in case of subsequent launches
	firstLaunch = window.require('uxp').AnOnboarding.getPrefBoolean("UseCaseDialog", "FirstLaunch", true);
	if(!firstLaunch) {
		let element = document.getElementById("ucip-heading");
		if (typeof(element) != 'undefined' && element != null) {
			element.innerHTML = strings["ucip-heading-return"].toString();
		}
	}
}

function logPIPEvent(msg) {
	window.require('uxp').AnOnboarding.logPIPEvent(msg);
}

function logCloseEvent() {
 
   	var obj = new Object();
   	obj.category = "UseCase_Panel";
   	obj.subcategory  = "Do_Not_Show_Again";
   	obj.event =  "Do Not Show"

   	var jsonString= JSON.stringify(obj);
	logPIPEvent(jsonString);
}

function logSkipEvent() {
 
   	var obj = new Object();
   	obj.category = "UseCase_Panel";
   	obj.subcategory  = "Skip";
   	obj.event =  "Skipped"

   	var jsonString= JSON.stringify(obj);
	logPIPEvent(jsonString);
}

function logDisplayEvent() {
 
   	var obj = new Object();
   	obj.category = "UseCase_Panel";
   	obj.subcategory  = "Display";
   	obj.event =  "Displayed"

   	var jsonString= JSON.stringify(obj);
	logPIPEvent(jsonString);
}

function logLaunchEvent(event) {
	var cardno = 'CardNumber:' + event.currentTarget.getAttribute('CardNumber') + ';';
   	var tutorialname = 'TutorialName:' + event.currentTarget.getAttribute('TutorialEnglishName') +';';
   	var tutorialid = 'TutorialId:' + event.currentTarget.getAttribute('id') +';';
   	var totalCards = 'TotalCards:' + totalcards;

   	var obj = new Object();
   	obj.category = "UseCase_Panel";
   	obj.subcategory  = "Card_Position_Clicked";
   	obj.event = cardno + totalCards + tutorialid + tutorialname;

   	var jsonString= JSON.stringify(obj);
	logPIPEvent(jsonString);
}

function skip() {
 
 	if(document.getElementById("donotshow").checked)
    	logCloseEvent();

	logSkipEvent();

	if(firstLaunch)
		window.require('uxp').AnOnboarding.setPrefBoolean("UseCaseDialog", "FirstLaunch", false);	//subsequent launches will no more be first launch
   	
	   //if we just want to close the extension then pass empty string as tutorial id
	window.require('uxp').AnOnboarding.launchCoachmarkTutorial("", !document.getElementById("donotshow").checked);
}

function launchTutorial(event) {
	logLaunchEvent(event);

    if(document.getElementById("donotshow").checked)
    	logCloseEvent();

	if(firstLaunch)
		window.require('uxp').AnOnboarding.setPrefBoolean("UseCaseDialog", "FirstLaunch", false);	//subsequent launches will no more be first launch

	window.require('uxp').AnOnboarding.launchCoachmarkTutorial(event.currentTarget.id, !document.getElementById("donotshow").checked);
}

function getCoachmarks() {
	let getLatest = window.localStorage.getItem("getLatestTutorials") === "false" ? false : true;
	window.localStorage.removeItem("getLatestTutorials");
	return window.require('uxp').AnOnboarding.getCoachmarks(getLatest);
}

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

function filePathToUri(path) {
    path = path.replaceAll('\\', '/');
	path = path.replaceAll(' ', '%20');
	if(path[0] !== '/') {
		// this is windows pathname, prepend it with a slash
		path = '/' + path;
	}
	path = "file://" + path;
    return path;
}

function getPreviewPath(id, inPreview) {
	let previewPath = inPreview;
	if(previewPath.indexOf("http://") != 0 || previewPath.indexOf("https://") != 0)
	{
		//the preview is present locally. In this case we are considering that the
		//preview is present within the workflow folder itself, and hence we calculate
		//the path based on this assumption.
		previewPath = coachmarkMap[id].rootDir + "/" + inPreview;
		previewPath = filePathToUri(previewPath);
	}
	return previewPath;
}

function getImage(inPath) {
	let image = document.createElement("img");
	image.setAttribute("style", "width:100%; height:100%; border-radius:4px;");
	image.setAttribute("src", inPath);
	return image;
}

function getSwf(inPath) {
	let swf = document.createElement("object", {is: "swf-player-view"});
	swf.setAttribute("style", "width:100%; height:100%; border-radius:4px;");
	swf.setAttribute("customAttributes", {FilePath: inPath});
	return swf;
}

var lastEvent;
var lastTarget = null;
function onMouseEvent(target, eventType) {
	target.innerHTML = "";
	let ismouseOver = eventType == "mouseover" ? true : false;
	let tutorial = getTutorialCard(target.id, ismouseOver);
	target.appendChild(tutorial);
}

function handleEvent(event) {
	let target = event.currentTarget;
	if(event.type == "mouseover") {
		if(lastEvent == "mouseover") {
			if(lastTarget !== null && lastTarget !== target) {
				onMouseEvent(lastTarget, "mouseout");
				onMouseEvent(target, "mouseover");
			}
		} else {
			onMouseEvent(target, "mouseover");
		}
	} else if (event.type == "mouseout") {
		onMouseEvent(target, "mouseout");
	}

	lastEvent = event.type;
	lastTarget = target;
}

function doNotShow() {
	let checkmark = document.getElementById("donotshow");
	checkmark.checked = !checkmark.checked;
}

async function loadTutorials() {

	pushToCoachmarkMap = (coachmark) => {
		var obj = new Object();
		obj.previewImage = coachmark["previewImage"];
		obj.previewSwf = coachmark["previewSwf"];
		obj.title = coachmark["name"];
		obj.rootDir = coachmark["rootDir"];
		obj.isCompleted = coachmark["completed"];

		coachmarkMap[coachmark["guid"]] = obj;
	}

	getTutorialDiv = (coachmark, index) => {
		let cardDiv = document.createElement("div");
		cardDiv.setAttribute("class", "card");
		cardDiv.setAttribute("id", coachmark["guid"]);
		cardDiv.setAttribute("TutorialName", coachmark["name"]);
		cardDiv.setAttribute("TutorialEnglishName", coachmark["englishName"]);
		cardDiv.setAttribute("CardNumber", index);	// This represents the card's location in Use case panel

		cardDiv.addEventListener("click", launchTutorial);
		cardDiv.addEventListener("mouseover", handleEvent);
		cardDiv.addEventListener("mouseout", handleEvent);

		let tutorial = getTutorialCard(coachmark["guid"], false);
		cardDiv.appendChild(tutorial);
		return cardDiv;
	}

	let parentDiv = document.getElementById("tutorials");
	parentDiv.innerHTML = "";

	let coachMarksStr = await getCoachmarks();
	let coachmarkArr = JSON.parse(coachMarksStr);
	let randomize = "random" === await window.require('uxp').AnOnboarding.getCoachmarkArrangement();
	if(randomize) {
		// Using Durstenfeld shuffle to generate random order.
		((array) => {
			for (let i = array.length - 1; i > 0; i--) {
	        	const j = Math.floor(Math.random() * (i + 1));
	        	[array[i], array[j]] = [array[j], array[i]];
	    	}
		})(coachmarkArr);
	}
	else {
		//Sorting based on the index provided.
		coachmarkArr.sort((a, b) => a.useCaseIndex - b.useCaseIndex);	
	}
	let maxDisplay = 6;
	let i = 0;
	let allCompleted = true;
	let completedCoachmarks = [];
	coachmarkArr.every((coachmark) => {
		if(i == maxDisplay)
			return false;

		pushToCoachmarkMap(coachmark);

		let showCustomTutorials = window.require('uxp').AnOnboarding.getPrefBoolean("UseCaseDialog", "ShowCustomTutorials", false);
		if(("shipped" === coachmark["originType"] || showCustomTutorials) && coachmark["useCaseIndex"] > 0 && 
			coachmark["previewSwf"] !== "" && coachmark["previewImage"] !== "")
		{
			if(randomize && coachmark["completed"]) {
				completedCoachmarks.push(coachmark);
				return true;
			}

			allCompleted = allCompleted && coachmark["completed"];
			i++;
			parentDiv.appendChild(getTutorialDiv(coachmark, i));
		}
		return true;
	});

	completedCoachmarks.every((coachmark) => {
		if(i == maxDisplay)
			return false;

		pushToCoachmarkMap(coachmark);
		i++;
		parentDiv.appendChild(getTutorialDiv(coachmark, i));

		return true;
	});

	totalcards = i;

	//introducing placeholder cards
	let modulo = totalcards % 3;
	let emptyCardCount = ((modulo == 0) ? 0 : (3 - modulo));
	while(emptyCardCount-- > 0) {
		let cardDiv = document.createElement("div");
		cardDiv.setAttribute("class", "card");
		cardDiv.setAttribute("style", "background-color:#F2F2F2;cursor:default");
		let label = document.createElement("label");
		label.setAttribute("style", "font-size:10px;font-style:italic;color:#D1D1D1;position:absolute;right:12px;bottom:12px");
		label.innerHTML = strings["ucip-comingsoon"].toString();

		cardDiv.appendChild(label);
		parentDiv.appendChild(cardDiv);
	}

	// updating the title of the dialog in case all the tutorials are marked completed
	if(allCompleted) {
		let element = document.getElementById("ucip-heading");
		if (typeof(element) != 'undefined' && element != null) {
			element.innerHTML = strings["ucip-heading-completed"].toString();
		}
	}
}

function getTutorialCard(id, ismouseOver) {
	let tutorialCard = document.createElement("div");
	tutorialCard.setAttribute("style", "position:relative;width:100%;height:100%");
	
	let preview;
	if(ismouseOver) {
		preview = getSwf(getPreviewPath(id, coachmarkMap[id].previewSwf));
	} else {
		preview = getImage(getPreviewPath(id, coachmarkMap[id].previewImage));
	}

	tutorialCard.appendChild(preview);

	let workflowCompleted = coachmarkMap[id].isCompleted;
	let displayOverlay = workflowCompleted || ismouseOver;
	if(displayOverlay) {
		let overlayDiv = document.createElement("div");
		overlayDiv.setAttribute("class", "overlay");

		if(ismouseOver) {
			let titleDiv = document.createElement("div");
			titleDiv.setAttribute("class", "title");
			let titleText = document.createElement("label");
			titleText.setAttribute("class", "titleText");
			titleText.innerHTML = coachmarkMap[id].title;

			titleDiv.appendChild(titleText);
			overlayDiv.appendChild(titleDiv);
		}

		if(workflowCompleted) {
			let completedDiv = document.createElement("div");
			completedDiv.setAttribute("style", "position:absolute;width:100%;height:100%;");
			let completedIcon = document.createElement("img");
			completedIcon.setAttribute("src", "../images/S_CheckmarkGreenCircle_18_N@2x.svg");
			completedIcon.setAttribute("style", "position:absolute;top:16px;left:16px;height:18px;width:18px");
			
			completedDiv.appendChild(completedIcon);
			overlayDiv.appendChild(completedDiv);
		}

		//Introducing a dummy overlay div to send the mouseover and mouseout events only once.
		//Else multiple events will be sent for different components.
		let dummyDiv = document.createElement("div");
		dummyDiv.setAttribute("class", "overlay");
		overlayDiv.appendChild(dummyDiv);

		tutorialCard.appendChild(overlayDiv);
	}
	return tutorialCard;
}

function main() {
	console.log("extension loaded");
	loadStrings();
	logDisplayEvent();
	loadTutorials();
}

function ReloadContent(event) {
	console.log("extension content reloaded");
	let eventJson = JSON.parse(event);
	window.localStorage.setItem("getLatestTutorials", eventJson["getLatestCoachmarks"]);
	window.location.reload();
}

//window.window.require('uxp').AnOnboarding.addEventListener("ReloadContentEvent", ReloadContent);
main();