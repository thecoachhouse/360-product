import React from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import { json } from "../data/surveyConfig";

const webhookUrl = "https://n8n-1hb1.sliplane.app/webhook/360-assessment-responses";

// Fisher-Yates shuffle algorithm for randomizing arrays
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Randomize questions within the survey (choices remain in original order)
function randomizeQuestions(surveyData) {
    // Create a deep copy to avoid mutating the original
    const randomizedData = JSON.parse(JSON.stringify(surveyData));
    
    if (randomizedData.pages && randomizedData.pages.length > 0) {
        randomizedData.pages.forEach(page => {
            // Randomize questions within each page
            if (page.elements && page.elements.length > 1) {
                page.elements = shuffleArray(page.elements);
            }
        });
    }
    return randomizedData;
}

function postResultsToWebhook(survey, options) {
    // Display the "Saving..." message
    options.showSaveInProgress();
    
    // Prepare the data to send to your n8n webhook
    const webhookData = {
        responses: survey.data,
        plainData: survey.getPlainData(),
        completedAt: new Date().toISOString(),
        surveyVersion: survey.version || "1.0",
        // Add any additional metadata you need
        assessmentType: "360_assessment", // You can make this dynamic
        timestamp: Date.now(),
        // User identification data (dummy data for now)
        user_id: "dummy-user-123", // TODO: Replace with actual user ID from auth
        respondent_id: "dummy-respondent-456", // TODO: Replace with actual respondent ID
        coachee_id: "dummy-coachee-789", // TODO: Replace with actual coachee ID
        assessment_id: "dummy-assessment-101", // TODO: Replace with actual assessment ID
        nomination_id: "dummy-nomination-202" // TODO: Replace with actual nomination ID (if applicable)
    };
    
    const headers = new Headers({ 
        "Content-Type": "application/json; charset=utf-8" 
    });
    
    fetch(webhookUrl, {
        method: "POST",
        body: JSON.stringify(webhookData),
        headers: headers
    }).then(response => {
        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
        }
        // Display the "Success" message
        options.showSaveSuccess();
        console.log("Survey data sent to webhook successfully:", webhookData);
    }).catch(error => {
        // Display the "Error" message
        options.showSaveError();
        console.error("Error sending survey data to webhook:", error);
    });
}

function SurveyComponent() {
    // Randomize the survey questions and create the model
    const randomizedSurveyJson = randomizeQuestions(json);
    const survey = new Model(randomizedSurveyJson);
    
    // Log survey completion for debugging
    survey.onComplete.add((sender, options) => {
        console.log("Survey completed. Data:", JSON.stringify(sender.data, null, 3));
        console.log("Plain data:", JSON.stringify(sender.getPlainData(), null, 3));
    });
    
    // Send results to your n8n webhook when completed
    survey.onComplete.add((survey, options) => {
        postResultsToWebhook(survey, options);
    });
    
    return (<Survey model={survey} />);
}

export default SurveyComponent;

