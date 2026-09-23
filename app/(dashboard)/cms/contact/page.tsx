"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { Eye, EyeOff, Save, Clock, MapPin, Trash2, Plus, Mail, ExternalLink, FileText, CheckCircle, Phone, MessageCircle } from 'lucide-react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SEOEditor from "@/components/form/SEOEditor";
import { useDialog } from "@/context/DialogContext";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";

const DEFAULT_DATA = {
    enabled: true,
    form_id: 'contact_form',
    hero: {
        title: "Contact Us",
        subtitle: "Get in Touch",
        description: "We're here to listen, support, and collaborate. Reach out to us today."
    },
    info: {
        address: "2 King Street West, Suite 100\nKitchener, Ontario N2G 1A3",
        addresses: [],
        phone: "",
        whatsapp: "",
        email: "",
        appointment_only: true,
        hours: [
            { label: "Monday to Friday", value: "9 am to 3:30 pm", note: "(By Appointment Only)" },
            { label: "Saturday", value: "10 am to 2 pm", note: "(By Appointment Only)" }
        ],
        disclaimer: "Please note: Scheduled programs, consultations, training, counseling and outreach support may happen outside these office hours and at a different location. If you have any questions, please email or call us.",
        show_info: true
    }
};

const DMLABS_CONTACT_DEFAULT = {
    enabled: true,
    form_id: 'contact_form',
    hero: {
        title: "Let's build the future.",
        subtitle: "Collaborate With Us",
        description: "Whether you have a question about our services, AI governance, or want to discuss a new project, we'd love to hear from you."
    },
    info: {
        address: "Ontario, Canada (Remote-First Agency)",
        addresses: [],
        phone: "",
        whatsapp: "",
        email: "",
        appointment_only: false,
        hours: [
            { label: "Monday to Friday", value: "9 am to 5 pm", note: "(EST)" }
        ],
        project_availability: {
            q1: false,
            q2: false,
            q3: true,
            q4: true
        },
        disclaimer: "Our team operates remotely and across various time zones to support our global mission-driven partners.",
        show_info: true
    }
};

const AITASOL_CONTACT_DEFAULT = {
    enabled: true,
    form_id: 'contact_form',
    hero: {
        title: "Contact Aitasol",
        subtitle: "Start Your Journey Today",
        description: "Have questions about studying abroad? Our expert counselors are ready to help you navigate your international education path."
    },
    info: {
        address: "20 McChlery Avenue South, Harare, Zimbabwe",
        addresses: [
            { label: "Virtual Office (Canada)", value: "Kitchener, ON", phone: "+1 (555) 000-0000", whatsapp: "+15550000000", email: "info@aitasol.com" },
            { label: "Local Office (Zimbabwe)", value: "20 McChlery Avenue South, cnr Nelson Mandela and Enterprise road, Harare, Zimbabwe", phone: "+263 (000) 000-0000", whatsapp: "+263 00 000 0000", email: "harare@aitasol.com" }
        ],
        phone: "+1 (555) 000-0000",
        whatsapp: "+15550000000",
        email: "info@aitasol.com",
        appointment_only: true,
        hours: [
            { label: "Monday to Friday", value: "9:00 AM - 5:00 PM", note: "EST" },
            { label: "Saturday", value: "10:00 AM - 2:00 PM", note: "By Appointment" }
        ],
        disclaimer: "Please note that we provide educational consultancy. For immigration-specific advice, we will refer you to our licensed partners.",
        show_info: true
    }
};

export default function ContactPageManager() {
    const { currentSite } = useSite();
    const { confirm, alert: dialogAlert } = useDialog();
    const [content, setContent] = useState<any>(null);
    const [availableForms, setAvailableForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("info@kindmindsfamilywellness.org");
    const [sendgridApiKey, setSendgridApiKey] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => { loadContent(); }, [currentSite.id]);

    const loadContent = async () => {
        setLoading(true);
        try {
            // 1. Fetch available forms for this site from the Forms Manager
            const forms = await FirestoreService.getForms(currentSite.id);
            setAvailableForms(forms);

            // 2. Fetch notification settings
            const settings = await FirestoreService.getSettings(currentSite.id, 'notifications');
            if (settings) {
                if (settings.recipient_email) setRecipientEmail(settings.recipient_email);
                if (settings.sendgrid_api_key) setSendgridApiKey(settings.sendgrid_api_key);
            } else if (currentSite.id === 'aitasol') {
                setRecipientEmail("info@aitasol.com");
            }

            const siteDefaults = currentSite.id === 'dmlabs' ? DMLABS_CONTACT_DEFAULT : (currentSite.id === 'aitasol' ? AITASOL_CONTACT_DEFAULT : DEFAULT_DATA);
            
            // Fetch live and draft data to prevent losing addresses when draft was created without them
            const liveData = await FirestoreService.getPageContent('contact', currentSite.id, 'live').catch(() => null);
            const draftData = await FirestoreService.getPageContent('contact', currentSite.id, 'draft').catch(() => null);
            const data = draftData || liveData;

            // Merge defensively: if draft has missing or empty addresses but live has them, preserve live addresses
            const resolvedAddresses = (data?.info?.addresses && data.info.addresses.length > 0)
                ? data.info.addresses
                : (liveData?.info?.addresses && liveData.info.addresses.length > 0
                    ? liveData.info.addresses
                    : siteDefaults.info.addresses || []);

            const mergedContent = data ? {
                ...siteDefaults,
                ...data,
                form_id: data.form_id || siteDefaults.form_id || 'contact_form',
                hero: { ...siteDefaults.hero, ...(data.hero || {}) },
                info: {
                    ...siteDefaults.info,
                    ...(data.info || {}),
                    addresses: resolvedAddresses,
                    hours: (data.info?.hours && data.info.hours.length > 0) ? data.info.hours : (liveData?.info?.hours ?? siteDefaults.info.hours),
                }
            } : siteDefaults;

            setContent(mergedContent);

            // Ensure contact_form exists in Forms collection if site is aitasol
            if (currentSite.id === 'aitasol') {
                const hasContactForm = forms.some(f => f.id === 'contact_form');
                if (!hasContactForm) {
                    await FirestoreService.saveForm('aitasol', 'contact_form', {
                        title: "Send a Message",
                        subtitle: "Contact",
                        description: "Get in touch with the Aitasol team for guidance on your international study path.",
                        submit_text: "Send Message",
                        success_message: "Message Sent! Our counselors will get back to you shortly.",
                        recipient_email: "info@aitasol.com",
                        form_fields: [
                            { id: 'name', label: 'Full Name', type: 'text', required: true },
                            { id: 'email', label: 'Email Address', type: 'email', required: true },
                            { id: 'phone', label: 'Phone Number', type: 'tel', required: false },
                            { 
                                id: 'destination', 
                                label: 'Preferred Destination', 
                                type: 'select', 
                                required: true,
                                options: ['Canada', 'UK', 'Australia', 'USA', 'Germany', 'Other']
                            },
                            { id: 'program', label: 'Interested Program', type: 'text', required: false },
                            { id: 'message', label: 'How can we help you?', type: 'textarea', required: true }
                        ]
                    });
                    const updatedForms = await FirestoreService.getForms(currentSite.id);
                    setAvailableForms(updatedForms);
                }
            }
        } catch (err: any) {
            console.error("Failed to load contact page content:", err);
            setError("Failed to load content.");
            setContent(DEFAULT_DATA);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        setSaving(true);
        setSuccessMsg(""); 
        setError("");
        try {
            await FirestoreService.savePageContent('contact', content, currentSite.id);
            await FirestoreService.saveSettings(currentSite.id, 'notifications', { 
                recipient_email: recipientEmail,
                sendgrid_api_key: sendgridApiKey
            });
            setSuccessMsg("Contact page and backend settings saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err: any) {
            console.error("Error saving contact page:", err);
            setError("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const setHero = (field: string, value: string) => {
        setContent((prev: any) => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
    };

    const setInfo = (field: string, value: any) => {
        setContent((prev: any) => ({ ...prev, info: { ...prev.info, [field]: value } }));
    };

    const updateHour = (index: number, field: string, value: string) => {
        const newHours = [...content.info.hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setInfo('hours', newHours);
    };

    const addHour = () => {
        setInfo('hours', [...content.info.hours, { label: '', value: '', note: '' }]);
    };

    const removeHour = (index: number) => {
        setInfo('hours', content.info.hours.filter((_: any, i: number) => i !== index));
    };
    
    const updateAddress = (index: number, field: string, value: string) => {
        const newAddresses = [...(content.info.addresses || [])];
        newAddresses[index] = { ...newAddresses[index], [field]: value };
        setInfo('addresses', newAddresses);
    };

    const addAddress = () => {
        const newAddresses = [...(content.info.addresses || [])];
        if (newAddresses.length === 0 && content.info.address) {
            newAddresses.push({ 
                label: 'Primary Location', 
                value: content.info.address, 
                phone: content.info.phone || '', 
                whatsapp: content.info.whatsapp || '',
                email: content.info.email || ''
            });
        }
        newAddresses.push({ label: '', value: '', phone: '', whatsapp: '', email: '' });
        setInfo('addresses', newAddresses);
    };

    const removeAddress = (index: number) => {
        setInfo('addresses', content.info.addresses.filter((_: any, i: number) => i !== index));
    };

    const handleSEOChange = (seoData: any) => {
        if (!content) return;
        setContent((prev: any) => ({ ...prev, seo: seoData }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!content) return null;

    const selectedForm = availableForms.find(f => f.id === (content.form_id || 'contact_form'));

    return (
        <>
            <PageMeta title={`Contact Page Manager | ${currentSite.name}`} description="Manage public contact details and embedded contact form" />
            <div className="space-y-6">
                <PageBreadcrumb pageTitle="Contact Page" />
                
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Contact Page Manager</h2>
                        <p className="text-sm text-gray-500">Edit office addresses, phone numbers, hours, and select which form is embedded.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <VersionHistoryManager 
                            siteId={currentSite.id} 
                            collection="content" 
                            documentId="contact" 
                            onRestore={(rolledBackData: any) => {
                                setContent(rolledBackData);
                                setSuccessMsg("Rolled back successfully!");
                            }} 
                        />
                        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error && <Alert variant="error" title="Error" message={error} />}
                {successMsg && <Alert variant="success" title="Success" message={successMsg} />}

                <div className="grid grid-cols-1 gap-6">
                    {/* SEO Settings */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <SEOEditor
                            data={content.seo || {}}
                            onChange={handleSEOChange}
                        />
                    </div>

                    {/* Hero Section */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Hero Section</h3>
                        <div className="space-y-4">
                            <div>
                                <Label>Tagline (Subtitle)</Label>
                                <Input value={content.hero.subtitle} onChange={e => setHero('subtitle', e.target.value)} />
                            </div>
                            <div>
                                <Label>Main Title</Label>
                                <Input value={content.hero.title} onChange={e => setHero('title', e.target.value)} />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm"
                                    rows={3}
                                    value={content.hero.description}
                                    onChange={e => setHero('description', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address & Contact Information */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-500" /> Office Details & Locations
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-normal">{content.info.show_info ? 'Visible' : 'Hidden'}</span>
                                <button
                                    onClick={() => setInfo('show_info', !content.info.show_info)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${content.info.show_info ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${content.info.show_info ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="font-bold text-gray-800 dark:text-white">Physical Locations / Branch Offices</Label>
                                        <p className="text-xs text-gray-500">Each entry renders a dedicated office card on the frontend with its phone, WhatsApp, and email.</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={addAddress} className="flex items-center gap-1">
                                        <Plus className="w-4 h-4 mr-1" /> Add Location
                                    </Button>
                                </div>

                                {(!content.info.addresses || content.info.addresses.length === 0) ? (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Single Address Mode</span>
                                            <Button size="sm" variant="outline" onClick={addAddress}>Switch to Multi-Office Mode</Button>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Address Text</Label>
                                            <textarea
                                                className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm font-mono"
                                                rows={3}
                                                value={content.info.address || ''}
                                                onChange={e => setInfo('address', e.target.value)}
                                                placeholder="Street address, city, country..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label className="text-xs">Phone Number</Label>
                                                <Input 
                                                    value={content.info.phone || ''} 
                                                    onChange={e => setInfo('phone', e.target.value)} 
                                                    placeholder="+1 (555) 000-0000" 
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">WhatsApp Number</Label>
                                                <Input 
                                                    value={content.info.whatsapp || ''} 
                                                    onChange={e => setInfo('whatsapp', e.target.value)} 
                                                    placeholder="+15550000000" 
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Email Address</Label>
                                                <Input 
                                                    value={content.info.email || ''} 
                                                    onChange={e => setInfo('email', e.target.value)} 
                                                    placeholder="info@aitasol.com" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {content.info.addresses.map((addr: any, i: number) => (
                                            <div key={i} className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 relative group">
                                                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                                                    <div className="flex-1 mr-4">
                                                        <Label className="text-[10px] uppercase font-bold text-gray-500">Location Label</Label>
                                                        <Input 
                                                            value={addr.label || ''} 
                                                            onChange={e => updateAddress(i, 'label', e.target.value)} 
                                                            placeholder="e.g. Virtual Office (Canada), Local Office (Zimbabwe)" 
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => removeAddress(i)} 
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-4"
                                                        title="Delete this location"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-gray-500">Physical Address / Description</Label>
                                                    <textarea
                                                        className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm font-mono"
                                                        rows={2}
                                                        value={addr.value || ''}
                                                        onChange={e => updateAddress(i, 'value', e.target.value)}
                                                        placeholder="20 McChlery Avenue South, Harare, Zimbabwe"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-blue-500" /> Phone Number
                                                        </Label>
                                                        <Input 
                                                            value={addr.phone || ''} 
                                                            onChange={e => updateAddress(i, 'phone', e.target.value)} 
                                                            placeholder="+1 (555) 000-0000" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                                            <MessageCircle className="w-3 h-3 text-emerald-500" /> WhatsApp (with country code)
                                                        </Label>
                                                        <Input 
                                                            value={addr.whatsapp || ''} 
                                                            onChange={e => updateAddress(i, 'whatsapp', e.target.value)} 
                                                            placeholder="+15550000000" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3 text-purple-500" /> Location Email
                                                        </Label>
                                                        <Input 
                                                            value={addr.email || ''} 
                                                            onChange={e => updateAddress(i, 'email', e.target.value)} 
                                                            placeholder="info@aitasol.com" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Appointment Badge */}
                            <div className="flex items-center gap-3 py-2 border-t border-b border-gray-100 dark:border-gray-800">
                                <input
                                    type="checkbox"
                                    id="appointment-only"
                                    checked={content.info.appointment_only || false}
                                    onChange={e => setInfo('appointment_only', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <Label htmlFor="appointment-only" className="mb-0 cursor-pointer">Show "By Appointment Only" Badge</Label>
                            </div>

                            {/* Office Hours */}
                            <div className="space-y-4 pt-2">
                                <Label className="flex items-center justify-between">
                                    <span className="font-bold">Office Hours</span>
                                    <Button size="sm" variant="outline" onClick={addHour}>
                                        <Plus className="w-4 h-4 mr-1" /> Add Entry
                                    </Button>
                                </Label>
                                
                                {content.info.hours?.map((hour: any, i: number) => (
                                    <div key={i} className="flex gap-3 items-start p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 relative group">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                                            <div>
                                                <Label className="text-[10px] uppercase text-gray-400">Days</Label>
                                                <Input value={hour.label || ''} onChange={e => updateHour(i, 'label', e.target.value)} placeholder="Monday - Friday" />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase text-gray-400">Time Range</Label>
                                                <Input value={hour.value || ''} onChange={e => updateHour(i, 'value', e.target.value)} placeholder="9:00 AM - 5:00 PM" />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase text-gray-400">Note (optional)</Label>
                                                <Input value={hour.note || ''} onChange={e => updateHour(i, 'note', e.target.value)} placeholder="EST / Appointment Only" />
                                            </div>
                                        </div>
                                        <button onClick={() => removeHour(i)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Disclaimer / Footer Note */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Label>Hours Disclaimer / Footer Note</Label>
                                <textarea
                                    className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm italic"
                                    rows={2}
                                    value={content.info.disclaimer || ''}
                                    onChange={e => setInfo('disclaimer', e.target.value)}
                                    placeholder="Please note that we provide educational consultancy..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Embedded Contact Form Component (Integrated with Forms Manager) */}
                    <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-blue-900/50 dark:bg-white/[0.03]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" /> Embedded Contact Form Element
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Forms are managed in the central <strong>Forms Manager</strong> and imported as an element into the Contact Page.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link 
                                    href={`/cms/forms/${content.form_id || 'contact_form'}`} 
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                                >
                                    <span>Edit Form in Forms Manager</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs font-bold uppercase text-gray-500">Select Embedded Form</Label>
                                <select
                                    value={content.form_id || 'contact_form'}
                                    onChange={(e) => setContent({ ...content, form_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm font-medium"
                                >
                                    {availableForms.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.title || f.id} ({f.id}) - {f.form_fields?.length || 0} fields
                                        </option>
                                    ))}
                                    {!availableForms.some(f => f.id === 'contact_form') && (
                                        <option value="contact_form">Contact Form (contact_form)</option>
                                    )}
                                </select>
                            </div>

                            {selectedForm ? (
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{selectedForm.title}</span>
                                        </div>
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full font-mono">
                                            ID: {selectedForm.id}
                                        </span>
                                    </div>
                                    {selectedForm.description && (
                                        <p className="text-xs text-gray-500">{selectedForm.description}</p>
                                    )}
                                    <div>
                                        <Label className="text-[10px] uppercase font-bold text-gray-400">Configured Form Fields</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedForm.form_fields?.map((field: any) => (
                                                <span key={field.id} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-lg text-gray-700 dark:text-gray-300">
                                                    {field.label} {field.required && <span className="text-red-500">*</span>} <span className="text-gray-400 font-mono">({field.type})</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 pt-1">
                                        Submit button: <strong>{selectedForm.submit_text || "Send Message"}</strong> &bull; Submissions are saved to <code>form_submissions</code> with notifications routed through Resend.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                                    <span>The form "{content.form_id || 'contact_form'}" has not been created yet in the Forms Manager.</span>
                                    <Link href="/cms/forms" className="font-bold underline ml-2">Open Forms Manager</Link>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Notification & Dispatch Settings */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" /> Lead Email Notifications
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Form submissions trigger automated email notifications. Configure your Resend API credentials, sender address, and recipients in <Link href="/settings/site?tab=integrations" className="text-blue-600 underline font-semibold">Global Site Settings &rarr; Webhooks & Integrations</Link>.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Default Notification Email</label>
                                <Input
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="info@aitasol.com"
                                />
                                <p className="text-xs text-gray-400">Fallback recipient for notifications if not customized in Site Settings.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Legacy SendGrid API Key (Optional)</label>
                                <Input
                                    type="password"
                                    value={sendgridApiKey}
                                    onChange={(e) => setSendgridApiKey(e.target.value)}
                                    placeholder="SG.xxx..."
                                />
                                <p className="text-xs text-gray-400">Resend is now the primary dispatcher; SendGrid remains available for legacy sites.</p>
                            </div>
                        </div>
                    </div>

                    {/* Page Online / Visibility Toggle */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${content.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {content.enabled ? <Eye size={20} /> : <EyeOff size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">Page Online</h3>
                                    <p className="text-xs text-gray-500">Toggle whether the Contact page is publicly accessible.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setContent({ ...content, enabled: !content.enabled })}
                                className={`w-12 h-6 rounded-full relative transition-colors ${content.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${content.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} className="px-10">
                        {saving ? "Saving..." : "Save All Changes"}
                    </Button>
                </div>
            </div>
        </>
    );
}
