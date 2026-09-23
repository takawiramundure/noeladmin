"use client";

import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useSite } from "@/context/SiteContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Plus, Trash2, Save, Zap, Link, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import { FirestoreService } from "@/services/firestore";
import VersionHistoryManager from "@/components/cms/VersionHistoryManager";
import { useAuth } from "@/context/AuthContext";
import MediaPickerModal from "@/components/common/MediaPickerModal";

interface FooterLink { label: string; url: string; }
interface NavColumn { heading: string; links: FooterLink[]; }

interface FooterContent {
    logo_url: string;
    logo_height?: number; // Custom logo height in px
    tagline: string;
    crisis_banner_enabled: boolean;
    crisis_banner_text: string;
    crisis_banner_number: string;
    crisis_banner_label: string;
    email: string;
    phone: string;
    address_line1: string;
    address_line2: string;
    appointment_only?: boolean;
    social_instagram: string;
    social_twitter: string;
    social_facebook: string;
    social_linkedin: string;
    social_youtube: string;
    nav_columns: NavColumn[];
    policy_links: FooterLink[];
    copyright_text: string;
    developer_text: string;
    developer_url: string;
    developer_credit_removed?: boolean;
    show_brand: boolean;
    show_contact: boolean;
    show_social: boolean;
    show_nav: boolean;
    show_policy: boolean;
    // Newsletter & Badges (Right Column / Layout Extras)
    newsletter_enabled?: boolean;
    newsletter_title?: string;
    newsletter_subtitle?: string;
    newsletter_button_text?: string;
    newsletter_success_msg?: string;
    badge_url?: string;
    badge_text?: string;
    contact_heading?: string;
    contact_subtext?: string;
    donate_button_text?: string;
    donate_button_url?: string;
}

const FOOTER_DEFAULTS: Record<string, FooterContent> = {
    kmfw: {
        logo_url: '/logo-footer.png',
        tagline: 'Empowering Black community wellness in Waterloo Region.',
        crisis_banner_enabled: true,
        crisis_banner_text: 'IMMEDIATE CRISIS SUPPORT',
        crisis_banner_number: '988',
        crisis_banner_label: 'Call or Text 988',
        email: 'info@kindmindsfamilywellness.org',
        phone: '+1-226-336-1988',
        address_line1: '2 King Street West, Suite 100',
        address_line2: 'Kitchener, ON N2G 1A3',
        appointment_only: true,
        social_instagram: '', social_twitter: '', social_facebook: '', social_linkedin: '', social_youtube: '',
        nav_columns: [
            { heading: 'Explore', links: [
                { label: 'About Our Story', url: '/about' },
                { label: 'Programs & Services', url: '/services' },
                { label: 'Community Events', url: '/events' },
                { label: 'Success Stories', url: '/impact/success-stories' },
                { label: 'Newsletters & Media', url: '/impact/newsletters' },
            ]},
            { heading: 'Join Us', links: [
                { label: 'Donate', url: '/donate' },
                { label: 'Volunteer', url: '/join-us/volunteer' },
                { label: 'Careers', url: '/join-us/careers' },
                { label: 'Partner With Us', url: '/contact' },
                { label: 'Our Partners', url: '/join-us/partners' },
                { label: 'Our Funders', url: '/join-us/funders' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }],
        copyright_text: '', developer_text: 'Designed by Digital Maples Labs Inc.', developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    dmlabs: {
        logo_url: 'https://framerusercontent.com/images/WNXCQwxTt2Dmjz4hPcX5bcoDw.svg',
        tagline: 'Empowering nonprofits through ethical tech & human-centric AI.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'hello@dmlabs.ca', phone: '', address_line1: 'Ontario, Canada', address_line2: '',
        appointment_only: false,
        social_instagram: 'https://instagram.com/dmlabs', social_twitter: 'https://twitter.com/dmlabs',
        social_facebook: '', social_linkedin: 'https://linkedin.com/company/digitalmaples', social_youtube: '',
        nav_columns: [
            { heading: 'Explore', links: [
                { label: 'Who We Are', url: '/about' }, { label: 'What We Do', url: '/services' },
                { label: 'Our Work', url: '/portfolio' }, { label: 'Just Opinions', url: '/blog' },
            ]},
            { heading: 'Connect', links: [
                { label: 'Get in Touch', url: '/contact' }, { label: 'Project Inquiry', url: '/contact' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Use', url: '/terms' }],
        copyright_text: `© ${new Date().getFullYear()} Digital Maples Labs Inc.`,
        developer_text: 'Designed by Digital Maples Labs', developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    aitasol: {
        logo_url: '/logo.png',
        tagline: 'Your trusted partner in global education consultancy.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'info@aitasol.com', phone: '+1 (234) 567-890',
        address_line1: '123 Education Hub, Global Plaza', address_line2: 'NY 10001',
        appointment_only: false,
        social_instagram: '', social_twitter: '', social_facebook: 'https://facebook.com/aitasol',
        social_linkedin: 'https://linkedin.com/company/aitasol', social_youtube: 'https://youtube.com/@aitasol',
        nav_columns: [
            { heading: 'Company', links: [
                { label: 'About Us', url: '/about' }, { label: 'Our Services', url: '/services' },
                { label: 'Partner Universities', url: '/universities' }, { label: 'Contact Us', url: '/contact' },
            ]},
            { heading: 'Destinations', links: [
                { label: 'Study in Canada', url: '/destinations/canada' }, { label: 'Study in UK', url: '/destinations/uk' },
                { label: 'Study in USA', url: '/destinations/usa' }, { label: 'Study in Australia', url: '/destinations/australia' },
            ]},
            { heading: 'Resources', links: [
                { label: 'Blog', url: '/blog' }, { label: 'Scholarship Guidance', url: '/services/scholarship-guidance' },
                { label: 'Visa Assistance', url: '/services/visa-assistance' }, { label: 'Apply Now', url: '/apply' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }, { label: 'Cookie Policy', url: '/cookies' }],
        copyright_text: `© ${new Date().getFullYear()} Aitasol Education Consultancy. All rights reserved.`,
        developer_text: 'Designed by Digital Maples Labs Inc.', developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    noel: {
        logo_url: '/logo.png',
        tagline: 'High-end renovation & custom woodworking.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'info@noelconstruction.ca', phone: '', address_line1: 'Ontario, Canada', address_line2: '',
        appointment_only: false,
        social_instagram: '', social_twitter: '', social_facebook: '', social_linkedin: '', social_youtube: '',
        nav_columns: [
            { heading: 'Company', links: [
                { label: 'About Us', url: '/about' }, { label: 'Services', url: '/services' },
                { label: 'Portfolio', url: '/portfolio' }, { label: 'Contact', url: '/contact' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }],
        copyright_text: '', developer_text: 'Designed by Digital Maples Labs Inc.', developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    phcg: {
        logo_url: '/logo.png',
        tagline: 'Compassionate senior care in Ontario.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'info@privatehomecareguru.ca', phone: '', address_line1: 'Ontario, Canada', address_line2: '',
        appointment_only: false,
        social_instagram: '', social_twitter: '', social_facebook: '', social_linkedin: '', social_youtube: '',
        nav_columns: [
            { heading: 'Quick Links', links: [
                { label: 'Home', url: '/' },
                { label: 'About Us', url: '/about' },
                { label: 'Care Solutions', url: '/service' },
                { label: 'Careers', url: '/career' },
                { label: 'Latest News', url: '/blog' },
                { label: 'FAQ', url: '/faq' },
                { label: 'Contact Us', url: '/contact' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }],
        copyright_text: '', developer_text: 'Designed by Digital Maples Labs Inc.', developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    nspc: {
        logo_url: '/logo.png',
        tagline: 'Suicide prevention through community collaboration.',
        crisis_banner_enabled: true, crisis_banner_text: 'CRISIS SUPPORT', crisis_banner_number: '988', crisis_banner_label: 'Call or Text 988',
        email: 'info@niagarasuicidepreventioncoalition.ca', phone: '', address_line1: 'Niagara Region', address_line2: 'Ontario, Canada',
        appointment_only: false,
        social_instagram: '', social_twitter: '', social_facebook: '', social_linkedin: '', social_youtube: '',
        nav_columns: [
            { heading: 'About', links: [
                { label: 'Our Mission', url: '/about' }, { label: 'Resources', url: '/resources' },
                { label: 'Events', url: '/events' }, { label: 'Contact', url: '/contact' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }],
        copyright_text: '', developer_text: 'Designed by Digital Maples Labs Inc.', developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    bweic: {
        logo_url: '/logo.png',
        tagline: 'A Black women–led initiative creating safe spaces for healing, empowerment, and community across Canada.',
        crisis_banner_enabled: false, crisis_banner_text: 'IMMEDIATE CRISIS SUPPORT', crisis_banner_number: '988', crisis_banner_label: 'Call or Text 988',
        email: 'info@bweic.ca', phone: '', address_line1: 'Ontario, Canada', address_line2: '',
        appointment_only: false,
        social_instagram: 'https://instagram.com', social_twitter: 'https://twitter.com', social_facebook: '', social_linkedin: 'https://linkedin.com', social_youtube: '',
        nav_columns: [
            { heading: 'Explore', links: [
                { label: 'About Us', url: '/about' },
                { label: 'Our Story', url: '/our-story' },
                { label: 'Who We Are', url: '/who-we-are' },
                { label: 'Leadership Team', url: '/leadership' },
                { label: 'Board of Directors', url: '/board-members' },
                { label: 'Careers', url: '/careers' },
            ]},
            { heading: 'Our Work', links: [
                { label: 'Flagship Programs', url: '/programs' },
                { label: 'Signature Programs', url: '/signature-programs' },
                { label: 'Special Initiatives', url: '/special-initiatives' },
                { label: 'Policy & Research', url: '/policy-research' },
                { label: 'Publications & Toolkits', url: '/publications' },
            ]},
            { heading: 'Community & Media', links: [
                { label: 'Upcoming Events', url: '/upcoming-events' },
                { label: 'Media Center', url: '/media-center' },
                { label: 'Press Releases & Op-Eds', url: '/releases-op-eds' },
                { label: 'Video Gallery', url: '/videos' },
                { label: 'BWEIC Shop', url: '/shop' },
            ]},
            { heading: 'Get Involved', links: [
                { label: 'Take Action', url: '/take-action' },
                { label: 'Volunteer & Mentorship', url: '/take-action#volunteer' },
                { label: 'Partner With Us', url: '/partners' },
                { label: 'Support Our Work', url: '/take-action#donate' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }],
        copyright_text: `© ${new Date().getFullYear()} Black Women Empowerment Initiative Canada (BWEIC). All rights reserved.`,
        developer_text: 'Designed & Developed by Digital Maples Labs Inc.',
        developer_url: 'https://digitalmaples.agency',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    elwg: {
        logo_url: '/logo.png',
        tagline: 'Supporting women in the Elliot Lake community.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'info@elwg.ca', phone: '', address_line1: 'Elliot Lake', address_line2: 'Ontario, Canada',
        appointment_only: false,
        social_instagram: '', social_twitter: '', social_facebook: '', social_linkedin: '', social_youtube: '',
        nav_columns: [
            { heading: 'Explore', links: [
                { label: 'About Us', url: '/about' }, { label: 'Programs', url: '/programs' },
                { label: 'Events', url: '/events' }, { label: 'Contact', url: '/contact' },
            ]},
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }],
        copyright_text: '', developer_text: 'Designed by Digital Maples Labs Inc.', developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true,
    },
    havens: {
        logo_url: '',
        tagline: 'Providing professional psychosocial support without the hiring overhead for long-term care and retirement homes across Ontario.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'lmushore@uwaterloo.ca',
        phone: '+289 547 1923',
        address_line1: 'Ontario, Canada',
        address_line2: '',
        appointment_only: false,
        social_instagram: '', social_twitter: '', social_facebook: '', social_linkedin: '', social_youtube: '',
        nav_columns: [
            { heading: 'Quick Links', links: [
                { label: 'Home', url: '/' },
                { label: 'Services', url: '/services' },
                { label: 'Why Us', url: '/why-us' },
                { label: 'Contact Us', url: '/contact' }
            ]}
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }],
        copyright_text: "Haven's Social Work Inc. All rights reserved.",
        developer_text: 'Designed by Digital Maples Labs Inc.',
        developer_url: 'https://digitalmaples.ca',
        show_brand: true, show_contact: true, show_social: false, show_nav: true, show_policy: true
    },
    pmt: {
        logo_url: '/logo.svg',
        tagline: 'Heal • Realign • Move Forward. Compassionate virtual psychotherapy for adults in Ontario.',
        crisis_banner_enabled: false, crisis_banner_text: '', crisis_banner_number: '', crisis_banner_label: '',
        email: 'hello@pullmethroughwellness.ca',
        phone: '+1 (289) 800-7688',
        address_line1: 'Virtual Psychotherapy across Ontario',
        address_line2: '',
        appointment_only: false,
        social_instagram: 'https://instagram.com/pullmethroughwellness', social_twitter: '', social_facebook: 'https://facebook.com/pullmethroughwellness', social_linkedin: 'https://linkedin.com/company/pull-me-through-wellness', social_youtube: '',
        nav_columns: [
            { heading: 'Quick Links', links: [
                { label: 'Home', url: '/' },
                { label: 'About', url: '/about' },
                { label: 'Services', url: '/services' },
                { label: 'Our Therapists', url: '/therapists' },
                { label: 'Resources', url: '/resources' },
                { label: 'FAQs', url: '/faqs' },
                { label: 'Contact', url: '/contact' }
            ]}
        ],
        policy_links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }],
        copyright_text: `© ${new Date().getFullYear()} Pull Me Through Wellness. All rights reserved.`,
        developer_text: 'Powered by Digital Maples',
        developer_url: 'https://digitalmaples.agency',
        show_brand: true, show_contact: true, show_social: true, show_nav: true, show_policy: true
    }
};

const getDefaultFooter = (siteId: string): FooterContent => {
    const base = FOOTER_DEFAULTS[siteId] || FOOTER_DEFAULTS.kmfw;
    return { ...base, developer_credit_removed: base.developer_credit_removed || false };
};

const SECTION_LABELS: Record<string, string> = {
    brand: 'Brand & Logo',
    crisis: 'Crisis Banner',
    contact: 'Contact Information',
    social: 'Social Media Links',
    nav: 'Navigation Columns',
    policy: 'Policy Links & Legal',
};

const Section = ({ id, isOpen, onToggle, isVisible, onVisibilityToggle, children }: { id: string; isOpen: boolean; onToggle: () => void; isVisible?: boolean; onVisibilityToggle?: () => void; children: React.ReactNode }) => {
    const sectionCls = "bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden";
    const headerCls = "w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";
    const bodyOpen = "p-5 border-t border-gray-100 dark:border-gray-700 space-y-4";
    
    return (
        <div className={sectionCls}>
            <div className="flex items-center">
                <button className={headerCls} onClick={onToggle}>
                    <span className="font-semibold text-gray-800 dark:text-white">{SECTION_LABELS[id]}</span>
                    {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </button>
                {onVisibilityToggle && (
                    <div className="pr-5 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-normal">{isVisible ? 'Visible' : 'Hidden'}</span>
                        <button
                            onClick={onVisibilityToggle}
                            className={`w-8 h-4 rounded-full relative transition-colors ${isVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>
                )}
            </div>
            {isOpen && <div className={bodyOpen}>{children}</div>}
        </div>
    );
};

export default function FooterManager() {
    const { currentSite } = useSite();
    const { profile } = useAuth();
    const isSuperAdmin = profile?.role === 'super_admin';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [openSection, setOpenSection] = useState<string>('brand');
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState<'logo' | 'badge'>('logo');

    const siteId = currentSite?.id || 'kmfw';
    const siteDefault = getDefaultFooter(siteId);
    const [content, setContent] = useState<FooterContent>(siteDefault);

    useEffect(() => {
        loadContent();
    }, [currentSite.id]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const data = await FirestoreService.getFooterData(siteId);
            if (data) {
                setContent({ ...siteDefault, ...data });
            } else {
                setContent(siteDefault);
            }
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Failed to load footer content.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            await FirestoreService.saveFooterData(content, siteId);
            setStatus({ type: 'success', msg: 'Footer saved successfully! Changes will appear on the website.' });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Failed to save footer.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSeedDefault = async () => {
        const seedData = getDefaultFooter(siteId);
        setSeeding(true);
        setStatus(null);
        try {
            await FirestoreService.saveFooterData(seedData, siteId);
            setContent(seedData);
            setStatus({ type: 'success', msg: `Footer seeded with ${siteId.toUpperCase()} default content!` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: 'Failed to seed.' });
        } finally {
            setSeeding(false);
        }
    };

    const set = (key: keyof FooterContent, value: any) => setContent(prev => ({ ...prev, [key]: value }));

    // Nav column helpers
    const addColumn = () => set('nav_columns', [...content.nav_columns, { heading: 'New Column', links: [] }]);
    const removeColumn = (i: number) => set('nav_columns', content.nav_columns.filter((_, idx) => idx !== i));
    const updateColumn = (i: number, key: keyof NavColumn, value: any) => {
        const cols = [...content.nav_columns];
        cols[i] = { ...cols[i], [key]: value };
        set('nav_columns', cols);
    };
    const addLink = (colIdx: number) => {
        const cols = [...content.nav_columns];
        cols[colIdx].links = [...cols[colIdx].links, { label: '', url: '' }];
        set('nav_columns', cols);
    };
    const updateLink = (colIdx: number, linkIdx: number, field: keyof FooterLink, value: string) => {
        const cols = [...content.nav_columns];
        cols[colIdx].links[linkIdx] = { ...cols[colIdx].links[linkIdx], [field]: value };
        set('nav_columns', cols);
    };
    const removeLink = (colIdx: number, linkIdx: number) => {
        const cols = [...content.nav_columns];
        cols[colIdx].links = cols[colIdx].links.filter((_, idx) => idx !== linkIdx);
        set('nav_columns', cols);
    };

    // Policy link helpers
    const addPolicyLink = () => set('policy_links', [...(content.policy_links || []), { label: '', url: '' }]);
    const updatePolicyLink = (i: number, field: keyof FooterLink, value: string) => {
        const links = [...(content.policy_links || [])];
        links[i] = { ...links[i], [field]: value };
        set('policy_links', links);
    };
    const removePolicyLink = (i: number) => set('policy_links', (content.policy_links || []).filter((_, idx) => idx !== i));

    const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    if (loading) return <div className="p-8 text-center text-gray-500">Loading footer settings...</div>;

    return (
        <>
            <PageMeta title={`Footer Manager | ${currentSite?.name || 'Admin'}`} description={`Manage footer content and settings for ${currentSite?.name}`} />
            <PageBreadcrumb pageTitle="Footer Manager" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Footer Manager</h1>
                        <p className="text-sm text-gray-500 mt-1">Edit footer content for <strong>{currentSite?.name}</strong> — changes go live after saving.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <VersionHistoryManager documentId="footer" siteId={siteId} />
                        <Button
                            requireSuperAdmin
                            onClick={handleSeedDefault}
                            disabled={seeding}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 border-green-300 text-green-600 hover:bg-green-50"
                        >
                            <Zap className="w-4 h-4" />
                            {seeding ? 'Seeding...' : `Seed ${currentSite?.name || 'Default'} Data`}
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save Footer'}
                        </Button>
                    </div>
                </div>

                {status && (
                    <Alert variant={status.type} title={status.type === 'success' ? 'Saved!' : 'Error'} message={status.msg} />
                )}

                {/* Brand & Logo */}
                <Section 
                    id="brand" 
                    isOpen={openSection === 'brand'} 
                    onToggle={() => setOpenSection(openSection === 'brand' ? '' : 'brand')}
                    isVisible={content.show_brand}
                    onVisibilityToggle={() => set('show_brand', !content.show_brand)}
                >
                    <div>
                        <Label>Logo URL</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input value={content.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="/logo-footer.png or https://..." />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setMediaPickerTarget('logo');
                                    setShowMediaPicker(true);
                                }}
                                className="flex items-center gap-2 whitespace-nowrap"
                            >
                                <ImageIcon className="w-4 h-4 text-blue-500" />
                                Pick / Upload Image
                            </Button>
                        </div>
                        {content.logo_url && (
                            <div className="mt-3 p-3 bg-gray-900/10 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 w-fit">
                                <img
                                    src={content.logo_url}
                                    alt="Footer Logo preview"
                                    className="max-w-[280px] object-contain rounded bg-gray-900/60 p-2 transition-all"
                                    style={{ height: `${content.logo_height || 100}px` }}
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p className="font-medium text-gray-700 dark:text-gray-300">Logo Preview ({content.logo_height || 100}px)</p>
                                    <p className="truncate max-w-[300px] font-mono text-[11px] text-gray-400">{content.logo_url}</p>
                                    <button
                                        type="button"
                                        onClick={() => set('logo_url', '')}
                                        className="text-red-500 hover:text-red-600 font-medium text-[11px]"
                                    >
                                        Remove Logo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Label>Footer Logo Height (Pixels)</Label>
                        <p className="text-xs text-gray-500 mb-3">Adjust the logo display size on the website (Default: 100px. Larger logos: 120px - 200px).</p>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="40"
                                max="300"
                                step="5"
                                value={content.logo_height || 100}
                                onChange={e => set('logo_height', Number(e.target.value))}
                                className="flex-1 accent-blue-600 cursor-pointer"
                            />
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    min="40"
                                    max="300"
                                    value={content.logo_height || 100}
                                    onChange={e => set('logo_height', Math.max(20, Math.min(400, Number(e.target.value) || 100)))}
                                    className="w-20 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-center text-sm font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <span className="text-xs font-semibold text-gray-500">px</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label>Certification / Nonprofit Badge Image (optional, e.g., Top-Rated Nonprofit)</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input value={content.badge_url || ''} onChange={e => set('badge_url', e.target.value)} placeholder="https://... or /badge.png" />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setMediaPickerTarget('badge');
                                    setShowMediaPicker(true);
                                }}
                                className="flex items-center gap-2 whitespace-nowrap"
                            >
                                <ImageIcon className="w-4 h-4 text-green-500" />
                                Pick / Upload Badge
                            </Button>
                        </div>
                        {content.badge_url && (
                            <div className="mt-3 p-3 bg-gray-900/10 dark:bg-gray-800/40 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-4 w-fit">
                                <img
                                    src={content.badge_url}
                                    alt="Badge preview"
                                    className="h-16 max-w-[200px] object-contain rounded"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p className="font-medium text-gray-700 dark:text-gray-300">Badge Preview</p>
                                    <button
                                        type="button"
                                        onClick={() => set('badge_url', '')}
                                        className="text-red-500 hover:text-red-600 font-medium text-[11px]"
                                    >
                                        Remove Badge
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <Label>Badge / Nonprofit Caption (e.g. "The Project is a certified 501(c)(3) nonprofit organization.")</Label>
                        <Input value={content.badge_text || ''} onChange={e => set('badge_text', e.target.value)} placeholder="A certified 501(c)(3) nonprofit organization." />
                    </div>
                    <div>
                        <Label>Tagline (optional short description under logo)</Label>
                        <Input value={content.tagline} onChange={e => set('tagline', e.target.value)} placeholder={siteDefault.tagline || 'Short description for your organization'} />
                    </div>
                    <div>
                        <Label>Copyright Text (leave empty for auto-generated)</Label>
                        <Input value={content.copyright_text} onChange={e => set('copyright_text', e.target.value)} placeholder={`© ${new Date().getFullYear()} ${currentSite?.name || 'Your Organization'}. All rights reserved.`} />
                    </div>
                    {isSuperAdmin && (
                        <>
                            <div className="flex items-center gap-3 mt-4 mb-2">
                                <input
                                    id="developer-credit-removed"
                                    type="checkbox"
                                    checked={content.developer_credit_removed || false}
                                    onChange={e => set('developer_credit_removed', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <Label htmlFor="developer-credit-removed" className="mb-0 cursor-pointer">
                                    Remove Developer Credit (Paid Version)
                                </Label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Developer Credit Text</Label>
                                    <Input value={content.developer_text} onChange={e => set('developer_text', e.target.value)} placeholder="Designed by Digital Maples Labs Inc." />
                                </div>
                                <div>
                                    <Label>Developer URL</Label>
                                    <Input value={content.developer_url} onChange={e => set('developer_url', e.target.value)} placeholder="https://digitalmaples.ca" />
                                </div>
                            </div>
                        </>
                    )}
                </Section>

                {/* Contact Info */}
                <Section 
                    id="contact" 
                    isOpen={openSection === 'contact'} 
                    onToggle={() => setOpenSection(openSection === 'contact' ? '' : 'contact')}
                    isVisible={content.show_contact}
                    onVisibilityToggle={() => set('show_contact', !content.show_contact)}
                >
                    <div>
                        <Label>Contact Section Heading (e.g. "Contact Us")</Label>
                        <Input value={content.contact_heading || ''} onChange={e => set('contact_heading', e.target.value)} placeholder="Contact Us" />
                    </div>
                    <div>
                        <Label>Contact Custom Subtext (e.g. "Want to help? Have questions? Contact us today.")</Label>
                        <Input value={content.contact_subtext || ''} onChange={e => set('contact_subtext', e.target.value)} placeholder="Want to help? Have questions? Reach out anytime." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Donate / Action Button Text (optional)</Label>
                            <Input value={content.donate_button_text || ''} onChange={e => set('donate_button_text', e.target.value)} placeholder="Donate" />
                        </div>
                        <div>
                            <Label>Donate / Action Button URL</Label>
                            <Input value={content.donate_button_url || ''} onChange={e => set('donate_button_url', e.target.value)} placeholder="/donate" />
                        </div>
                    </div>
                    <div>
                        <Label>Email Address</Label>
                        <Input value={content.email} onChange={e => set('email', e.target.value)} placeholder={siteDefault.email || 'info@yoursite.com'} />
                    </div>
                    <div>
                        <Label>Phone Number (optional)</Label>
                        <Input value={content.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (519) 000-0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Address Line 1</Label>
                            <Input value={content.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="Kitchener-Waterloo Area," />
                        </div>
                        <div>
                            <Label>Address Line 2</Label>
                            <Input value={content.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="Ontario, Canada" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <input
                            id="appointment-only"
                            type="checkbox"
                            checked={content.appointment_only}
                            onChange={e => set('appointment_only', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <Label htmlFor="appointment-only" className="mb-0 cursor-pointer">Show "By Appointment Only" Badge in Footer</Label>
                    </div>
                </Section>

                {/* Social Media */}
                <Section 
                    id="social" 
                    isOpen={openSection === 'social'} 
                    onToggle={() => setOpenSection(openSection === 'social' ? '' : 'social')}
                    isVisible={content.show_social}
                    onVisibilityToggle={() => set('show_social', !content.show_social)}
                >
                    <p className="text-sm text-gray-500 mb-2">Leave a field empty to hide that social icon.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'social_instagram', label: 'Instagram', placeholder: `https://instagram.com/${siteId}` },
                            { key: 'social_twitter', label: 'Twitter / X', placeholder: `https://twitter.com/${siteId}` },
                            { key: 'social_facebook', label: 'Facebook', placeholder: `https://facebook.com/${siteId}` },
                            { key: 'social_linkedin', label: 'LinkedIn', placeholder: `https://linkedin.com/company/${siteId}` },
                            { key: 'social_youtube', label: 'YouTube', placeholder: `https://youtube.com/@${siteId}` },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <Label>{label} URL</Label>
                                <Input
                                    value={(content as any)[key] || ''}
                                    onChange={e => set(key as keyof FooterContent, e.target.value)}
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}
                    </div>
                </Section>

                {/* Navigation Columns */}
                <Section 
                    id="nav" 
                    isOpen={openSection === 'nav'} 
                    onToggle={() => setOpenSection(openSection === 'nav' ? '' : 'nav')}
                    isVisible={content.show_nav}
                    onVisibilityToggle={() => set('show_nav', !content.show_nav)}
                >
                    <p className="text-sm text-gray-500 mb-4">Add up to 3 navigation columns for the footer. Each column has a heading and a list of links.</p>
                    <div className="space-y-6">
                        {content.nav_columns.map((col, colIdx) => (
                            <div key={colIdx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex-1 mr-4">
                                        <Label>Column Heading</Label>
                                        <Input
                                            value={col.heading}
                                            onChange={e => updateColumn(colIdx, 'heading', e.target.value)}
                                            placeholder="Explore"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeColumn(colIdx)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-900/20 mt-6"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2 mb-3">
                                    {col.links.map((link, linkIdx) => (
                                        <div key={linkIdx} className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={link.label}
                                                    onChange={e => updateLink(colIdx, linkIdx, 'label', e.target.value)}
                                                    placeholder="Link Label"
                                                    className={inputCls}
                                                />
                                            </div>
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    <Link className="w-3.5 h-3.5" />
                                                </span>
                                                <input
                                                    type="text"
                                                    value={link.url}
                                                    onChange={e => updateLink(colIdx, linkIdx, 'url', e.target.value)}
                                                    placeholder="/path or https://"
                                                    className={`${inputCls} pl-8`}
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeLink(colIdx, linkIdx)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <Button onClick={() => addLink(colIdx)} variant="outline" size="sm">
                                    <Plus className="w-3 h-3 mr-1" /> Add Link
                                </Button>
                            </div>
                        ))}
                    </div>

                    {content.nav_columns.length < 3 && (
                        <Button onClick={addColumn} variant="outline" className="mt-4">
                            <Plus className="w-4 h-4 mr-2" /> Add Column
                        </Button>
                    )}
                </Section>

                {/* Newsletter & Updates Column */}
                <Section 
                    id="newsletter" 
                    isOpen={openSection === 'newsletter'} 
                    onToggle={() => setOpenSection(openSection === 'newsletter' ? '' : 'newsletter')}
                    isVisible={content.newsletter_enabled !== false}
                    onVisibilityToggle={() => set('newsletter_enabled', content.newsletter_enabled === false ? true : false)}
                >
                    <p className="text-sm text-gray-500 mb-3">Settings for the distinct right column (Get Social & Newsletter Subscription box).</p>
                    <div className="space-y-4">
                        <div>
                            <Label>Newsletter Section Title</Label>
                            <Input
                                value={content.newsletter_title || ''}
                                onChange={e => set('newsletter_title', e.target.value)}
                                placeholder="Get Our Latest Updates"
                            />
                        </div>
                        <div>
                            <Label>Newsletter Subtitle / Description (optional)</Label>
                            <Input
                                value={content.newsletter_subtitle || ''}
                                onChange={e => set('newsletter_subtitle', e.target.value)}
                                placeholder="Subscribe to stay in the loop with our programs & news."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Subscribe Button Label</Label>
                                <Input
                                    value={content.newsletter_button_text || ''}
                                    onChange={e => set('newsletter_button_text', e.target.value)}
                                    placeholder="Subscribe"
                                />
                            </div>
                            <div>
                                <Label>Success Confirmation Message</Label>
                                <Input
                                    value={content.newsletter_success_msg || ''}
                                    onChange={e => set('newsletter_success_msg', e.target.value)}
                                    placeholder="Thank you for subscribing!"
                                />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Policy Links */}
                <Section 
                    id="policy" 
                    isOpen={openSection === 'policy'} 
                    onToggle={() => setOpenSection(openSection === 'policy' ? '' : 'policy')}
                    isVisible={content.show_policy}
                    onVisibilityToggle={() => set('show_policy', !content.show_policy)}
                >
                    <p className="text-sm text-gray-500 mb-3">These links appear at the bottom right of the footer (Privacy Policy, Terms of Service, etc.)</p>
                    <div className="space-y-2">
                        {(content.policy_links || []).map((link, i) => (
                            <div key={i} className="flex gap-3 items-center">
                                <div className="flex-1">
                                    <input type="text" value={link.label} onChange={e => updatePolicyLink(i, 'label', e.target.value)} placeholder="Privacy Policy" className={inputCls} />
                                </div>
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Link className="w-3.5 h-3.5" /></span>
                                    <input type="text" value={link.url} onChange={e => updatePolicyLink(i, 'url', e.target.value)} placeholder="/privacy or https://" className={`${inputCls} pl-8`} />
                                </div>
                                <button onClick={() => removePolicyLink(i)} className="p-2 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-900/20">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={addPolicyLink} variant="outline" className="mt-3">
                        <Plus className="w-4 h-4 mr-2" /> Add Policy Link
                    </Button>
                </Section>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Footer Settings'}
                    </Button>
                </div>

                <MediaPickerModal
                    isOpen={showMediaPicker}
                    onClose={() => setShowMediaPicker(false)}
                    onSelect={(url) => {
                        if (mediaPickerTarget === 'badge') {
                            set('badge_url', url);
                        } else {
                            set('logo_url', url);
                        }
                    }}
                />
            </div>
        </>
    );
}
