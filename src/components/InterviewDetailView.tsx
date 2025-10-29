import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, FileText, Brain, Save, Download, BarChart3, Loader2 } from 'lucide-react';
import { MultimodalReportView } from './MultimodalReportView';

interface InterviewDetailViewProps {
  interview: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const InterviewDetailView = ({ interview, onClose, onUpdate }: InterviewDetailViewProps) => {
  // Demo multimodal analysis data
  const demoMultimodalAnalysis = {
    audio: {
      audio_sentiment: {
        overall: "positive",
        score: 0.72,
        confidence: 87,
        details: {
          positive_indicators: [
            "Clear and articulate responses throughout the interview",
            "Confident tone when discussing technical achievements",
            "Enthusiastic when describing problem-solving experiences",
            "Professional and composed communication style"
          ],
          negative_indicators: [
            "Slight hesitation when discussing unfamiliar technologies",
            "Minor decrease in pace during complex technical explanations"
          ]
        }
      },
      audio_emotions: {
        dominant_emotion: "Confidence",
        detected: [
          {
            emotion: "Confidence",
            timestamp: "00:00-02:30",
            intensity: 85,
            indicators: ["steady voice tone", "clear articulation", "minimal pauses"]
          },
          {
            emotion: "Enthusiasm",
            timestamp: "02:30-05:00",
            intensity: 78,
            indicators: ["increased speaking pace", "energetic tone", "animated descriptions"]
          },
          {
            emotion: "Joy",
            timestamp: "03:40-04:25",
            intensity: 72,
            indicators: ["warm tone", "positive language", "engaging storytelling"]
          },
          {
            emotion: "Nervousness",
            timestamp: "04:25-04:50",
            intensity: 25,
            indicators: ["brief pause", "slower pace"]
          }
        ],
        emotional_trajectory: "Started with strong confidence, maintained high enthusiasm throughout, showed excellent emotional regulation with minimal nervousness. Demonstrated authentic passion for technology and professional growth."
      },
      speech_patterns: {
        estimated_pace: 145,
        clarity_score: 92,
        confidence_level: 88,
        filler_words: "Minimal (3-4)"
      }
    },
    video: {
      video_sentiment: {
        overall: "positive",
        score: 0.78,
        confidence: 91,
        details: {
          positive_visual_cues: [
            "Maintained excellent eye contact throughout the interview",
            "Open and welcoming body language",
            "Genuine smiles during positive discussions",
            "Professional posture and presentation",
            "Animated hand gestures when explaining technical concepts"
          ],
          negative_visual_cues: [
            "Brief moments of looking away during complex questions",
            "Occasional fidgeting during pauses"
          ]
        }
      },
      video_emotions: {
        dominant_emotion: "Confidence",
        detected: [
          {
            emotion: "Confidence",
            timestamp: "00:00-02:30",
            intensity: 88,
            visual_indicators: ["direct eye contact", "relaxed shoulders", "open posture"]
          },
          {
            emotion: "Enthusiasm",
            timestamp: "02:30-05:00",
            intensity: 82,
            visual_indicators: ["animated expressions", "forward lean", "expressive gestures"]
          },
          {
            emotion: "Joy",
            timestamp: "03:40-04:25",
            intensity: 75,
            visual_indicators: ["genuine smile", "bright eyes", "relaxed facial muscles"]
          },
          {
            emotion: "Concentration",
            timestamp: "04:25-04:50",
            intensity: 70,
            visual_indicators: ["focused gaze", "thoughtful expression", "minimal movement"]
          }
        ]
      },
      visual_engagement: {
        eye_contact: 89,
        facial_expressions: 85,
        posture_quality: 91,
        gesture_appropriateness: 87,
        overall_presence: "Dhivya demonstrated exceptional visual engagement with consistent eye contact and professional body language. Her facial expressions were authentic and matched the content of her responses. Hand gestures were natural and helped emphasize key points without being distracting.",
        professional_appearance: "Professional and well-presented throughout the interview"
      }
    }
  };

  // Demo data for Dhivya
  const demoTranscript = [
    {
      speaker: "AI Interviewer",
      text: "Hello Dhivya! Thank you for joining us today. Could you start by telling me about your experience with full-stack development?",
      timestamp: "00:00:15"
    },
    {
      speaker: "Dhivya",
      text: "Thank you for having me! I have over 5 years of experience in full-stack development, primarily working with React, Node.js, and PostgreSQL. In my current role, I lead a team of 4 developers building scalable enterprise applications.",
      timestamp: "00:00:45"
    },
    {
      speaker: "AI Interviewer",
      text: "That's impressive! Can you describe a challenging technical problem you solved recently?",
      timestamp: "00:01:20"
    },
    {
      speaker: "Dhivya",
      text: "Recently, we faced a performance bottleneck in our API that was causing 3-second response times. I implemented Redis caching, optimized our database queries with proper indexing, and introduced a CDN for static assets. This reduced response times to under 200ms and improved user satisfaction by 40%.",
      timestamp: "00:02:10"
    },
    {
      speaker: "AI Interviewer",
      text: "Excellent problem-solving approach! How do you stay current with rapidly evolving technologies?",
      timestamp: "00:02:55"
    },
    {
      speaker: "Dhivya",
      text: "I dedicate time each week to learning through online courses, contribute to open-source projects, and actively participate in developer communities. I recently completed certifications in cloud architecture and microservices design. I also maintain a technical blog where I share my learnings.",
      timestamp: "00:03:40"
    },
    {
      speaker: "AI Interviewer",
      text: "That shows great initiative! Tell me about your experience with team collaboration and leadership.",
      timestamp: "00:04:25"
    },
    {
      speaker: "Dhivya",
      text: "I strongly believe in collaborative development. I've mentored junior developers, conducted code reviews, and established best practices for our team. I've also led sprint planning sessions and facilitated knowledge-sharing workshops. My leadership style focuses on empowering team members and fostering a culture of continuous improvement.",
      timestamp: "00:05:15"
    }
  ];

  const demoAISummary = `**Overall Assessment:**
Dhivya demonstrated exceptional technical competency and strong leadership qualities throughout the interview. Her responses showed deep understanding of full-stack development principles and practical experience solving complex technical challenges.

**Key Strengths:**
• Strong technical foundation in modern web technologies (React, Node.js, PostgreSQL)
• Proven leadership experience managing a development team
• Excellent problem-solving skills with measurable results (40% improvement in user satisfaction)
• Proactive approach to continuous learning and professional development
• Clear communication and ability to articulate technical concepts effectively
• Active contribution to developer communities and open-source projects

**Technical Skills Demonstrated:**
• Full-stack development with 5+ years experience
• Performance optimization and system architecture
• Database optimization and caching strategies
• Cloud architecture and microservices design
• Team leadership and mentoring capabilities

**Professional Development:**
• Regular participation in online courses and certifications
• Maintains technical blog for knowledge sharing
• Active in open-source community
• Demonstrated commitment to staying current with technology trends

**Communication & Soft Skills:**
• Articulate and confident communication style
• Strong examples with quantifiable results
• Demonstrates leadership through mentorship and team building
• Collaborative mindset with focus on team empowerment

**Recommendation:**
STRONG HIRE - Dhivya exceeds the requirements for the Senior Software Engineer position. Her combination of technical expertise, leadership experience, and commitment to continuous learning makes her an excellent candidate. She would be a valuable addition to the engineering team.`;

  const demoHRNotes = `**Interview Date:** ${new Date().toLocaleDateString()}
**Candidate:** Dhivya
**Position:** Senior Software Engineer

**Initial Impressions:**
Dhivya presented herself professionally and demonstrated strong confidence throughout the interview. Her responses were well-structured and showed genuine enthusiasm for the role.

**Technical Assessment:**
- Demonstrated excellent knowledge of full-stack technologies
- Provided concrete examples of problem-solving with measurable outcomes
- Shows leadership potential with team management experience
- Active learner with recent certifications

**Cultural Fit:**
- Aligns well with our values of continuous learning and collaboration
- Strong mentorship qualities that would benefit our junior developers
- Proactive approach to professional development

**Next Steps:**
✓ Recommend moving forward to final round
✓ Schedule technical deep-dive with engineering team
✓ Discuss team structure and leadership opportunities
✓ Salary expectations to be discussed in final round

**Overall Rating:** 92/100 - Excellent Candidate`;

  const [hrNotes, setHrNotes] = useState(interview.feedback || demoHRNotes);
  const [saving, setSaving] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [multimodalAnalysis, setMultimodalAnalysis] = useState<any>(demoMultimodalAnalysis);
  const { toast } = useToast();

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('interviews')
      .update({ feedback: hrNotes })
      .eq('id', interview.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'HR notes updated successfully',
      });
      onUpdate();
    }
    setSaving(false);
  };

  const downloadTranscript = () => {
    const transcript = JSON.stringify(interview.transcript || demoTranscript, null, 2);
    const blob = new Blob([transcript], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${interview.candidate_name || 'Dhivya'}.json`;
    a.click();
  };

  const generateMultimodalReport = async () => {
    setLoadingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('multimodal-analysis', {
        body: { interviewId: interview.id }
      });

      if (error) throw error;

      if (data?.analysis) {
        setMultimodalAnalysis(data.analysis);
        toast({
          title: 'Success',
          description: 'Multimodal analysis completed',
        });
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate multimodal report',
        variant: 'destructive',
      });
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Interview: {interview.candidate_name || interview.resumes?.candidate_name}
          </DialogTitle>
          <DialogDescription>
            Position: {interview.resumes?.job_roles?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge>Status: {interview.status}</Badge>
            {interview.ai_score && (
              <Badge variant="outline">AI Score: {interview.ai_score}/100</Badge>
            )}
            {interview.duration_seconds && (
              <Badge variant="secondary">
                Duration: {Math.floor(interview.duration_seconds / 60)}m {interview.duration_seconds % 60}s
              </Badge>
            )}
          </div>

          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transcript">
                <FileText className="h-4 w-4 mr-2" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="ai-summary">
                <Brain className="h-4 w-4 mr-2" />
                AI Summary
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                HR Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="space-y-4">
              <div className="space-y-3">
                <Button onClick={downloadTranscript} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Transcript
                </Button>
                <div className="bg-secondary/20 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {(interview.transcript || demoTranscript).map((entry: any, idx: number) => (
                    <div key={idx} className="mb-4 pb-4 border-b last:border-0">
                      <p className="font-medium text-sm mb-1">
                        {entry.speaker || `Speaker ${idx + 1}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.text || entry.content}
                      </p>
                      {entry.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.timestamp}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-summary" className="space-y-4">
              <div className="bg-secondary/20 p-4 rounded-lg space-y-3">
                <div>
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {interview.ai_summary || demoAISummary}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium">
                    Overall Score: <span className="text-2xl ml-2">{interview.ai_score || 92}/100</span>
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <MultimodalReportView 
                audioAnalysis={multimodalAnalysis.audio}
                videoAnalysis={multimodalAnalysis.video}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">HR Notes</label>
                <Textarea
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                  placeholder="Add your notes about this interview..."
                  rows={10}
                  className="resize-none"
                />
              </div>
              <Button onClick={saveNotes} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notes'}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
