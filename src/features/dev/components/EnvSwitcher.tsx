import React, { useState } from 'react';
import { TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { useDevStore } from '../stores/devStore';
import { DEFAULT_ENVIRONMENTS, EnvType } from '../config/types';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Check, Edit2, ChevronDown, ChevronUp } from 'lucide-react-native';

const EnvSwitcher: React.FC = () => {
    const theme = useTheme<Theme>();
    const { currentEnvId, setEnvId, customApiUrl, setCustomUrl } = useDevStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingCustom, setIsEditingCustom] = useState(false);
    const [tempUrl, setTempUrl] = useState(customApiUrl || '');

    const handleEnvSelect = (id: EnvType) => {
        setEnvId(id);
        // Clear custom URL when switching base env to avoid confusion, 
        // or keep it? Let's keep it but user might want to clear it.
        // For now, selecting a preset does NOT clear custom URL, 
        // but the UI should show that Custom is active if it exists.
    };

    const handleSaveCustom = () => {
        setCustomUrl('api', tempUrl.trim() || null);
        setIsEditingCustom(false);
    };

    return (
        <Box>
            {/* Presets List */}
            <Box flexDirection="row" flexWrap="wrap" gap="s" marginBottom="m">
                {(Object.keys(DEFAULT_ENVIRONMENTS) as EnvType[]).map((envType) => {
                    const env = DEFAULT_ENVIRONMENTS[envType];
                    const isActive = currentEnvId === envType;

                    return (
                        <TouchableOpacity
                            key={envType}
                            onPress={() => handleEnvSelect(envType)}
                            style={{ flex: 1, minWidth: '30%' }}
                        >
                            <Box
                                paddingVertical="s"
                                paddingHorizontal="m"
                                borderRadius="m"
                                borderWidth={1}
                                backgroundColor={isActive ? 'primary' : 'cardSecondary'}
                                borderColor={isActive ? 'primary' : 'border'}
                                alignItems="center"
                                justifyContent="center"
                                flexDirection="row"
                            >
                                {isActive && <Check size={14} color="white" style={{ marginRight: 4 }} />}
                                <Text
                                    variant="caption"
                                    fontWeight="bold"
                                    color={isActive ? 'onPrimary' : 'textSecondary'}
                                >
                                    {env.label}
                                </Text>
                            </Box>
                        </TouchableOpacity>
                    );
                })}
            </Box>

            {/* Custom URL Section */}
            <Box
                backgroundColor="cardSecondary"
                borderRadius="m"
                padding="s"
                borderWidth={1}
                borderColor={customApiUrl ? 'warning' : 'transparent'}
            >
                <TouchableOpacity
                    onPress={() => setIsExpanded(!isExpanded)}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Box flexDirection="row" alignItems="center">
                        <Edit2 size={16} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                        <Text variant="caption" fontWeight="600" color="textSecondary">
                            Custom API Override
                        </Text>
                    </Box>
                    {customApiUrl && (
                        <Box backgroundColor="warning" paddingHorizontal="s" borderRadius="s" marginRight="s">
                            <Text variant="small" color="black" fontWeight="bold">ACTIVE</Text>
                        </Box>
                    )}
                    {isExpanded ? <ChevronUp size={16} color={theme.colors.textSecondary} /> : <ChevronDown size={16} color={theme.colors.textSecondary} />}
                </TouchableOpacity>

                {isExpanded && (
                    <Box marginTop="s">
                        <TextInput
                            value={isEditingCustom ? tempUrl : (customApiUrl || DEFAULT_ENVIRONMENTS[currentEnvId].apiUrl)}
                            onChangeText={setTempUrl}
                            editable={isEditingCustom}
                            placeholder="https://api.example.com"
                            placeholderTextColor={theme.colors.textTertiary}
                            style={{
                                backgroundColor: theme.colors.mainBackground,
                                padding: 8,
                                borderRadius: 4,
                                fontSize: 12,
                                color: isEditingCustom ? theme.colors.textPrimary : theme.colors.textSecondary,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}
                            autoCapitalize="none"
                        />
                        <Box flexDirection="row" justifyContent="flex-end" marginTop="s" gap="s">
                            {isEditingCustom ? (
                                <>
                                    <TouchableOpacity onPress={() => setIsEditingCustom(false)}>
                                        <Text variant="caption" color="textSecondary" style={{ padding: 4 }}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSaveCustom}>
                                        <Text variant="caption" color="primary" fontWeight="bold" style={{ padding: 4 }}>Save</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {customApiUrl && (
                                        <TouchableOpacity onPress={() => setCustomUrl('api', null)}>
                                            <Text variant="caption" color="error" style={{ padding: 4 }}>Clear</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={() => { setTempUrl(customApiUrl || ''); setIsEditingCustom(true); }}>
                                        <Text variant="caption" color="primary" style={{ padding: 4 }}>Edit</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default EnvSwitcher;
