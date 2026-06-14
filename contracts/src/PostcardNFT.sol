// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title PostcardNFT
/// @notice Mints a visual "journey" receipt NFT for each cross-chain payment
contract PostcardNFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    struct Postcard {
        address sender;
        address recipient;
        uint256 amount;
        string tokenSymbol;
        string srcChainName;
        string dstChainName;
        string message;
        uint256 timestamp;
    }

    uint256 public nextId;
    mapping(uint256 => Postcard) public postcards;

    address public paymentRouter;

    event PostcardMinted(uint256 indexed tokenId, address indexed recipient, address indexed sender);

    constructor() ERC721("Postcard", "PCARD") Ownable(msg.sender) {}

    function setPaymentRouter(address _router) external onlyOwner {
        paymentRouter = _router;
    }

    modifier onlyRouter() {
        require(msg.sender == paymentRouter || msg.sender == owner(), "not authorized");
        _;
    }

    function mintPostcard(
        address recipient,
        address sender,
        uint256 amount,
        string memory tokenSymbol,
        string memory srcChainName,
        string memory dstChainName,
        string memory message
    ) external onlyRouter returns (uint256) {
        uint256 tokenId = nextId++;
        postcards[tokenId] = Postcard({
            sender: sender,
            recipient: recipient,
            amount: amount,
            tokenSymbol: tokenSymbol,
            srcChainName: srcChainName,
            dstChainName: dstChainName,
            message: message,
            timestamp: block.timestamp
        });
        _safeMint(recipient, tokenId);
        emit PostcardMinted(tokenId, recipient, sender);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Postcard memory p = postcards[tokenId];

        string memory svg = _generateSVG(p);
        string memory image = string(abi.encodePacked("data:image/svg+xml;base64,", Base64.encode(bytes(svg))));
        string memory json = string(
            abi.encodePacked(
                '{"name":"Postcard #',
                tokenId.toString(),
                '","description":"A cross-chain payment journey from ',
                p.srcChainName,
                " to ",
                p.dstChainName,
                '","image":"',
                image,
                '","attributes":[',
                '{"trait_type":"From Chain","value":"',
                p.srcChainName,
                '"},',
                '{"trait_type":"To Chain","value":"',
                p.dstChainName,
                '"},',
                '{"trait_type":"Token","value":"',
                p.tokenSymbol,
                '"},',
                '{"trait_type":"Message","value":"',
                p.message,
                '"}',
                "]}"
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _generateSVG(Postcard memory p) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250">',
                '<rect width="400" height="250" rx="16" fill="#1a1b23"/>',
                '<circle cx="60" cy="60" r="24" fill="#ff007a"/>',
                '<text x="60" y="66" font-size="12" fill="#fff" text-anchor="middle" font-family="monospace">',
                p.srcChainName,
                "</text>",
                '<circle cx="340" cy="60" r="24" fill="#00d4aa"/>',
                '<text x="340" y="66" font-size="12" fill="#fff" text-anchor="middle" font-family="monospace">',
                p.dstChainName,
                "</text>",
                '<line x1="84" y1="60" x2="316" y2="60" stroke="#666" stroke-width="2" stroke-dasharray="6,6"/>',
                '<circle cx="200" cy="60" r="6" fill="#ffd166"/>',
                '<text x="200" y="120" font-size="28" text-anchor="middle" font-family="sans-serif" fill="#fff">',
                p.message,
                "</text>",
                '<text x="200" y="160" font-size="20" text-anchor="middle" font-family="monospace" fill="#fff">',
                _formatAmount(p.amount),
                " ",
                p.tokenSymbol,
                "</text>",
                '<text x="200" y="220" font-size="10" text-anchor="middle" font-family="monospace" fill="#888">',
                "Postcard from ",
                p.srcChainName,
                " to ",
                p.dstChainName,
                "</text>",
                "</svg>"
            )
        );
    }

    function _formatAmount(uint256 amount) internal pure returns (string memory) {
        uint256 whole = amount / 1e6;
        uint256 frac = (amount % 1e6) / 1e4;
        if (frac < 10) {
            return string(abi.encodePacked(whole.toString(), ".0", frac.toString()));
        }
        return string(abi.encodePacked(whole.toString(), ".", frac.toString()));
    }
}
