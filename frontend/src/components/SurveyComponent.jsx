import React, { useState, useEffect } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import { json } from "../data/surveyConfig";
import { supabase } from "../supabaseClient";
import { parseNomineesFromOnboarding, validateNomineeNames } from "../utils/onboardingProcessor";

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

async function createPendingNominations(coacheeId, nominees) {
    try {
        console.log('Creating pending nominations for coachee:', coacheeId, nominees);
        
        // Validate nominee names
        const validation = validateNomineeNames(nominees);
        if (!validation.valid) {
            console.warn('Validation errors:', validation.errors);
            // Continue anyway, but log warnings
        }
        
        // Create pending nominations
        const pendingNominations = nominees.map(nominee => ({
            coachee_id: coacheeId,
            nominee_id: null, // Pending until admin adds email
            relationship_type: nominee.relationshipType,
            pending_nominee_name: nominee.name,
            status: 'pending',
            created_at: new Date().toISOString()
        }));
        
        // Insert all pending nominations
        const { data, error } = await supabase
            .from('nominations')
            .insert(pendingNominations)
            .select();
        
        if (error) {
            console.error('Error creating pending nominations:', error);
            // Don't throw - allow response to be saved even if nominations fail
            return { success: false, error };
        }
        
        console.log('Pending nominations created:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Failed to create pending nominations:', error);
        return { success: false, error };
    }
}

async function saveToSupabase(survey, assessmentTemplateId, coacheeId, respondentEmail, assessmentType) {
    try {
        const { data, error } = await supabase
            .from('assessment_responses')
            .insert({
                assessment_template_id: assessmentTemplateId,
                coachee_id: coacheeId,
                respondent_email: respondentEmail,
                raw_response_data: survey.data,
                submitted_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving to Supabase:', error);
            throw error;
        }

        console.log('Assessment response saved to Supabase:', data);
        
        // If this is an onboarding assessment, parse nominees and create pending nominations
        if (assessmentType === 'onboarding' && survey.data) {
            const nominees = parseNomineesFromOnboarding(survey.data);
            
            if (nominees.length > 0) {
                console.log(`Parsed ${nominees.length} nominees from onboarding response`);
                await createPendingNominations(coacheeId, nominees);
            } else {
                console.log('No nominees found in onboarding response');
            }
        }
        
        return data;
    } catch (error) {
        console.error('Failed to save assessment response:', error);
        throw error;
    }
}

async function postResultsToWebhook(survey, options, metadata) {
    // Display the "Saving..." message
    options.showSaveInProgress();
    
    const { assessmentTemplateId, coacheeId, respondentEmail, assessmentType, nominationId } = metadata;

    try {
        // First, save to Supabase
        const supabaseData = await saveToSupabase(
            survey,
            assessmentTemplateId,
            coacheeId,
            respondentEmail,
            assessmentType
        );

        // Then send to webhook (optional, for external processing)
        const webhookData = {
            responses: survey.data,
            plainData: survey.getPlainData(),
            completedAt: new Date().toISOString(),
            surveyVersion: survey.version || "1.0",
            assessmentType: assessmentType,
            timestamp: Date.now(),
            assessment_template_id: assessmentTemplateId,
            coachee_id: coacheeId,
            respondent_email: respondentEmail,
            nomination_id: nominationId || null,
            supabase_response_id: supabaseData.id
        };
        
        const headers = new Headers({ 
            "Content-Type": "application/json; charset=utf-8" 
        });
        
        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                body: JSON.stringify(webhookData),
                headers: headers
            });

            if (!response.ok) {
                console.warn(`Webhook request failed: ${response.status} ${response.statusText}`);
                // Don't fail the whole submission if webhook fails
            } else {
                console.log("Survey data sent to webhook successfully:", webhookData);
            }
        } catch (webhookError) {
            console.warn("Error sending survey data to webhook (non-critical):", webhookError);
            // Don't fail the whole submission if webhook fails
        }

        // Display the "Success" message
        options.showSaveSuccess();
        
        // Call onComplete callback if provided
        if (metadata.onComplete) {
            setTimeout(() => {
                metadata.onComplete();
            }, 2000); // Wait 2 seconds to show success message
        }
    } catch (error) {
        // Display the "Error" message
        options.showSaveError();
        console.error("Error saving assessment:", error);
        throw error;
    }
}

function SurveyComponent({ 
    template, 
    assessmentType = 'peer', 
    coacheeId, 
    nominationId,
    onComplete 
}) {
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeSurvey();
    }, [template, assessmentType]);

    const initializeSurvey = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user for respondent email
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('User not authenticated');
            }

            let surveyJson;

            // Use provided template or fallback to default JSON
            if (template && template.survey_json) {
                surveyJson = typeof template.survey_json === 'string' 
                    ? JSON.parse(template.survey_json) 
                    : template.survey_json;
            } else {
                // Fallback to default JSON for backwards compatibility
                surveyJson = json;
            }

            // Randomize the survey questions
            const randomizedSurveyJson = randomizeQuestions(surveyJson);
            const surveyModel = new Model(randomizedSurveyJson);
            
            // Log survey completion for debugging
            surveyModel.onComplete.add((sender, options) => {
                console.log("Survey completed. Data:", JSON.stringify(sender.data, null, 3));
                console.log("Plain data:", JSON.stringify(sender.getPlainData(), null, 3));
            });
            
            // Save results when completed
            surveyModel.onComplete.add(async (surveyInstance, options) => {
                // Prepare metadata for saving
                const metadata = {
                    assessmentTemplateId: template?.id,
                    coacheeId: coacheeId,
                    respondentEmail: user.email,
                    assessmentType: assessmentType || template?.template_type || 'peer',
                    nominationId: nominationId,
                    onComplete: onComplete
                };

                await postResultsToWebhook(surveyInstance, options, metadata);
            });

            setSurvey(surveyModel);
        } catch (err) {
            console.error('Error initializing survey:', err);
            setError(err.message || 'Failed to load assessment');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e9ecef',
                        borderTopColor: '#0d6efd',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#6c757d' }}>Loading assessment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '24px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                color: '#856404'
            }}>
                <p><strong>Error:</strong> {error}</p>
            </div>
        );
    }

    if (!survey) {
        return (
            <div style={{ padding: '24px', color: '#6c757d' }}>
                <p>No assessment available.</p>
            </div>
        );
    }

    return <Survey model={survey} />;
}

export default SurveyComponent;

