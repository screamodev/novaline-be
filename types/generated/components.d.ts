import type { Schema, Struct } from '@strapi/strapi';

export interface AssistantReply extends Struct.ComponentSchema {
  collectionName: 'components_assistant_replys';
  info: {
    displayName: 'Fallback reply';
    icon: 'message';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    keywords: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface RadioStream extends Struct.ComponentSchema {
  collectionName: 'components_radio_streams';
  info: {
    displayName: 'Stream';
    icon: 'volumeUp';
  };
  attributes: {
    bitrate: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsAbout extends Struct.ComponentSchema {
  collectionName: 'components_sections_abouts';
  info: {
    displayName: 'About';
    icon: 'information';
  };
  attributes: {
    body: Schema.Attribute.Blocks;
    heading: Schema.Attribute.Component<'sections.heading', false>;
    stats: Schema.Attribute.Component<'shared.stat', true>;
  };
}

export interface SectionsCoverageCopy extends Struct.ComponentSchema {
  collectionName: 'components_sections_coverage_copys';
  info: {
    displayName: 'Coverage copy';
    icon: 'pinMap';
  };
  attributes: {
    heading: Schema.Attribute.Component<'sections.heading', false>;
    hint: Schema.Attribute.String;
    legendCity: Schema.Attribute.String;
    legendVillage: Schema.Attribute.String;
    mapHint: Schema.Attribute.String;
    mapTitle: Schema.Attribute.String;
    nodesCount: Schema.Attribute.Integer;
    nodesLabel: Schema.Attribute.String;
    resultNote: Schema.Attribute.String;
    resultTitle: Schema.Attribute.String;
    speedValue: Schema.Attribute.String;
    technology: Schema.Attribute.String;
  };
}

export interface SectionsHeading extends Struct.ComponentSchema {
  collectionName: 'components_sections_headings';
  info: {
    displayName: 'Section heading';
    icon: 'heading';
  };
  attributes: {
    kicker: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heros';
  info: {
    displayName: 'Hero';
    icon: 'star';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    kicker: Schema.Attribute.String;
    primaryCta: Schema.Attribute.String;
    promoText: Schema.Attribute.String;
    secondaryCta: Schema.Attribute.String;
    speedCaption: Schema.Attribute.String;
    speedUnit: Schema.Attribute.String;
    speedValue: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    titleLine1: Schema.Attribute.String & Schema.Attribute.Required;
    titleLine2: Schema.Attribute.String;
  };
}

export interface SectionsTrustItem extends Struct.ComponentSchema {
  collectionName: 'components_sections_trust_items';
  info: {
    displayName: 'Trust item';
    icon: 'shield';
  };
  attributes: {
    icon: Schema.Attribute.Enumeration<
      ['support', 'engineer', 'power', 'award']
    > &
      Schema.Attribute.Required;
    text: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedFeature extends Struct.ComponentSchema {
  collectionName: 'components_shared_features';
  info: {
    displayName: 'Feature';
    icon: 'check';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLabelValue extends Struct.ComponentSchema {
  collectionName: 'components_shared_label_values';
  info: {
    displayName: 'Label / value';
    icon: 'bulletList';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedPhone extends Struct.ComponentSchema {
  collectionName: 'components_shared_phones';
  info: {
    displayName: 'Phone';
    icon: 'phone';
  };
  attributes: {
    display: Schema.Attribute.String & Schema.Attribute.Required;
    primary: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tel: Schema.Attribute.String & Schema.Attribute.Required;
    viber: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 170;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSocial extends Struct.ComponentSchema {
  collectionName: 'components_shared_socials';
  info: {
    displayName: 'Social link';
    icon: 'link';
  };
  attributes: {
    network: Schema.Attribute.Enumeration<
      ['instagram', 'telegram', 'facebook', 'youtube', 'viber']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedStat extends Struct.ComponentSchema {
  collectionName: 'components_shared_stats';
  info: {
    displayName: 'Stat';
    icon: 'chartCircle';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    tone: Schema.Attribute.Enumeration<['glass', 'coral', 'violet']> &
      Schema.Attribute.DefaultTo<'glass'>;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedStep extends Struct.ComponentSchema {
  collectionName: 'components_shared_steps';
  info: {
    displayName: 'Step';
    icon: 'arrowRight';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'assistant.reply': AssistantReply;
      'radio.stream': RadioStream;
      'sections.about': SectionsAbout;
      'sections.coverage-copy': SectionsCoverageCopy;
      'sections.heading': SectionsHeading;
      'sections.hero': SectionsHero;
      'sections.trust-item': SectionsTrustItem;
      'shared.feature': SharedFeature;
      'shared.label-value': SharedLabelValue;
      'shared.phone': SharedPhone;
      'shared.seo': SharedSeo;
      'shared.social': SharedSocial;
      'shared.stat': SharedStat;
      'shared.step': SharedStep;
    }
  }
}
